
from flask import Blueprint, request, jsonify
from app import db
from models import Product, Quotation, QuotationItem, User
import os
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt,
)

api_bp = Blueprint('api', __name__, url_prefix='/api')


# --- Autenticación / Auth ---
@api_bp.route('/auth/login', methods=['POST'])
def auth_login():
    """Login simple que emite un JWT con el role del usuario.

    Espera JSON: {"username": "...", "password": "..."}
    Las credenciales se comparan con `ADMIN_USER` / `ADMIN_PASSWORD`.
    Devuelve: {"access_token": "...", "role": "admin"}
    """
    data = request.get_json() or {}
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'username and password required'}), 400

    # Validar contra la tabla User
    try:
        user = User.query.filter_by(username=username).first()
    except Exception as e:
        return jsonify({'error': 'Server error accessing users', 'details': str(e)}), 500

    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid credentials'}), 401

    additional_claims = {'role': 'admin'}
    access_token = create_access_token(identity=username, additional_claims=additional_claims)
    return jsonify({'access_token': access_token, 'role': 'admin'}), 200

@api_bp.route('/products', methods=['GET'])
def get_products():
    """Devuelve la lista de productos."""
    products = Product.query.all()
    # Asegúrate de que tu modelo Product tiene el método to_dict()
    return jsonify([p.to_dict() for p in products]), 200


@api_bp.route('/products', methods=['POST'])
@jwt_required()
def create_product():
    """Crea un nuevo producto (requiere role=admin)."""
    data = request.get_json() or {}
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({'error': 'Forbidden - admin role required'}), 403

    name = data.get('name')
    image_url = data.get('image_url')
    description = data.get('description')
    sku = data.get('sku')

    if not name:
        return jsonify({'error': 'name is required'}), 400

    try:
        p = Product(name=name, image_url=image_url, description=description, sku=sku)
        db.session.add(p)
        db.session.commit()
        return jsonify({'message': 'Product created', 'product': p.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create product', 'details': str(e)}), 500


@api_bp.route('/products/<int:id>', methods=['PUT'])
@jwt_required()
def update_product(id):
    """Actualiza un producto por id (requiere role=admin)."""
    data = request.get_json() or {}
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({'error': 'Forbidden - admin role required'}), 403

    try:
        p = Product.query.get(id)
        if not p:
            return jsonify({'error': f'Product with id {id} not found'}), 404

        # Actualizar campos permitidos
        if 'name' in data:
            p.name = data.get('name')
        if 'image_url' in data:
            p.image_url = data.get('image_url')
        if 'description' in data:
            p.description = data.get('description')
        if 'sku' in data:
            p.sku = data.get('sku')

        db.session.commit()
        return jsonify({'message': 'Product updated', 'product': p.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update product', 'details': str(e)}), 500


@api_bp.route('/products/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_product(id):
    """Elimina un producto por id (requiere role=admin)."""
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({'error': 'Forbidden - admin role required'}), 403

    try:
        p = Product.query.get(id)
        if not p:
            return jsonify({'error': f'Product with id {id} not found'}), 404

        db.session.delete(p)
        db.session.commit()
        return jsonify({'message': 'Product deleted'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete product', 'details': str(e)}), 500


@api_bp.route('/quotations', methods=['GET'])
@jwt_required()
def list_quotations():
    """Lista todas las cotizaciones (protegida, requiere JWT con role=admin)."""
    try:
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({'error': 'Forbidden - admin role required'}), 403

        quotations = Quotation.query.order_by(Quotation.created_at.desc()).all()
        return jsonify([q.to_dict() for q in quotations]), 200
    except Exception as e:
        return jsonify({'error': 'Failed to retrieve quotations', 'details': str(e)}), 500


@api_bp.route('/quotations', methods=['POST'])
def create_quotation():
    # --- Lógica para crear una nueva cotización ---
    data = request.get_json()

    if not data or 'customer_name' not in data or 'customer_email' not in data:
        return jsonify({'error': 'customer_name and customer_email are required'}), 400

    try:
        new_quotation = Quotation(
            customer_name=data['customer_name'],
            customer_email=data['customer_email'],
            customer_phone=data.get('customer_phone')
        )
        db.session.add(new_quotation)

        if 'items' in data and isinstance(data['items'], list):
            for item_data in data['items']:
                product = Product.query.get(item_data['product_id'])
                if not product:
                    db.session.rollback()
                    return jsonify({'error': f"Product with id {item_data['product_id']} not found"}), 404

                quotation_item = QuotationItem(
                    quotation=new_quotation,
                    product=product,
                    quantity=item_data['quantity']
                )
                db.session.add(quotation_item)

        db.session.commit()
        return jsonify({'message': 'Quotation created successfully'}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'An error occurred', 'details': str(e)}), 500


@api_bp.route('/quotations/<int:id>', methods=['PATCH'])
@jwt_required()
def update_quotation(id):
    """Actualiza una cotización concreta con la respuesta del admin (requiere role=admin)."""
    data = request.get_json() or {}

    if 'admin_response' not in data:
        return jsonify({'error': "'admin_response' is required in request body"}), 400

    try:
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({'error': 'Forbidden - admin role required'}), 403

        quotation = Quotation.query.get(id)
        if not quotation:
            return jsonify({'error': f'Quotation with id {id} not found'}), 404

        quotation.admin_response = data.get('admin_response')
        quotation.status = 'Responded'
        db.session.commit()

        return jsonify({'message': 'Quotation updated successfully', 'quotation': quotation.to_dict()}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update quotation', 'details': str(e)}), 500
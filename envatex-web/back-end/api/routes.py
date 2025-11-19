from flask import Blueprint, request, jsonify
from app import db
from models import Product, Quotation, QuotationItem, User
import os
import cloudinary.uploader
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
        return jsonify({'error': 'Se requieren nombre de usuario y contraseña'}), 400

    # Validar contra la tabla User
    try:
        user = User.query.filter_by(username=username).first()
    except Exception as e:
        return jsonify({'error': 'Error del servidor al acceder a los usuarios', 'details': str(e)}), 500

    if not user or not user.check_password(password):
        return jsonify({'error': 'Credenciales inválidas'}), 401

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
    # Ahora aceptamos multipart/form-data: request.form + request.files
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({'error': 'Prohibido - se requiere rol de administrador'}), 403

    name = request.form.get('name')
    description = request.form.get('description')
    sku = request.form.get('sku')
    image_url = None

    # Subir imagen si viene en request.files['image']
    image_file = request.files.get('image')
    if image_file:
        try:
            upload_res = cloudinary.uploader.upload(image_file)
            image_url = upload_res.get('secure_url')
        except Exception as e:
            return jsonify({'error': 'No se pudo subir la imagen', 'details': str(e)}), 500
    else:
        image_url = request.form.get('image_url')

    if not name:
        return jsonify({'error': 'El nombre es obligatorio'}), 400

    try:
        p = Product(name=name, image_url=image_url, description=description, sku=sku)
        db.session.add(p)
        db.session.commit()
        return jsonify({'message': 'Producto creado', 'product': p.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'No se pudo crear el producto', 'details': str(e)}), 500


@api_bp.route('/products/<int:id>', methods=['PUT'])
@jwt_required()
def update_product(id):
    """Actualiza un producto por id (requiere role=admin)."""
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({'error': 'Prohibido - se requiere rol de administrador'}), 403

    try:
        p = Product.query.get(id)
        if not p:
            return jsonify({'error': f'Producto con id {id} no encontrado'}), 404

        # Aceptar multipart/form-data para actualización
        name = request.form.get('name')
        description = request.form.get('description')
        sku = request.form.get('sku')

        if name:
            p.name = name
        if description:
            p.description = description
        if sku:
            p.sku = sku

        image_file = request.files.get('image')
        if image_file:
            try:
                upload_res = cloudinary.uploader.upload(image_file)
                p.image_url = upload_res.get('secure_url')
            except Exception as e:
                db.session.rollback()
                return jsonify({'error': 'No se pudo subir la imagen', 'details': str(e)}), 500
        else:
            # Si se envía image_url en el formulario (por compatibilidad), actualizarla
            image_url = request.form.get('image_url')
            if image_url:
                p.image_url = image_url

        db.session.commit()
        return jsonify({'message': 'Producto actualizado', 'product': p.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'No se pudo actualizar el producto', 'details': str(e)}), 500


@api_bp.route('/products/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_product(id):
    """Elimina un producto por id (requiere role=admin)."""
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({'error': 'Prohibido - se requiere rol de administrador'}), 403

    try:
        p = Product.query.get(id)
        if not p:
            return jsonify({'error': f'Producto con id {id} no encontrado'}), 404

        db.session.delete(p)
        db.session.commit()
        return jsonify({'message': 'Producto eliminado'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'No se pudo eliminar el producto', 'details': str(e)}), 500


@api_bp.route('/quotations', methods=['GET'])
@jwt_required()
def list_quotations():
    """Lista todas las cotizaciones (protegida, requiere JWT con role=admin)."""
    try:
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({'error': 'Prohibido - se requiere rol de administrador'}), 403

        quotations = Quotation.query.order_by(Quotation.created_at.desc()).all()
        return jsonify([q.to_dict() for q in quotations]), 200
    except Exception as e:
        return jsonify({'error': 'No se pudieron obtener las cotizaciones', 'details': str(e)}), 500


@api_bp.route('/quotations', methods=['POST'])
def create_quotation():
    # --- Lógica para crear una nueva cotización ---
    data = request.get_json()

    if not data or 'customer_name' not in data or 'customer_email' not in data:
        return jsonify({'error': 'Se requieren nombre y correo del cliente (customer_name y customer_email)'}), 400

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
                    return jsonify({'error': f"Producto con id {item_data['product_id']} no encontrado"}), 404

                quotation_item = QuotationItem(
                    quotation=new_quotation,
                    product=product,
                    quantity=item_data['quantity']
                )
                db.session.add(quotation_item)

        db.session.commit()
        return jsonify({'message': 'Cotización creada correctamente'}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Ocurrió un error', 'details': str(e)}), 500


@api_bp.route('/quotations/<int:id>', methods=['PATCH'])
@jwt_required()
def update_quotation(id):
    """Actualiza una cotización concreta con la respuesta del admin (requiere role=admin)."""
    data = request.get_json() or {}

    if 'admin_response' not in data:
        return jsonify({'error': "'admin_response' es obligatorio en el cuerpo de la petición"}), 400

    try:
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({'error': 'Prohibido - se requiere rol de administrador'}), 403

        quotation = Quotation.query.get(id)
        if not quotation:
            return jsonify({'error': f'Cotización con id {id} no encontrada'}), 404

        quotation.admin_response = data.get('admin_response')
        quotation.status = 'Responded'
        db.session.commit()

        return jsonify({'message': 'Cotización actualizada correctamente', 'quotation': quotation.to_dict()}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'No se pudo actualizar la cotización', 'details': str(e)}), 500


@api_bp.route('/quotations/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_quotation(id):
    """Elimina una cotización por ID (requiere role=admin)."""
    try:
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({'error': 'Prohibido - se requiere rol de administrador'}), 403

        quotation = Quotation.query.get(id)
        if not quotation:
            return jsonify({'error': f'Cotización con id {id} no encontrada'}), 404

        # Eliminar los items asociados primero si existen
        for item in quotation.items:
            db.session.delete(item)
        db.session.delete(quotation)
        db.session.commit()
        return jsonify({'message': 'Cotización eliminada'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'No se pudo eliminar la cotización', 'details': str(e)}), 500
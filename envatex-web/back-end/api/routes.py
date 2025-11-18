
from flask import Blueprint, request, jsonify
from app import db
from models import Product, Quotation, QuotationItem

api_bp = Blueprint('api', __name__, url_prefix='/api')


@api_bp.route('/products', methods=['GET'])
def get_products():
    """Devuelve la lista de productos."""
    products = Product.query.all()
    # Asegúrate de que tu modelo Product tiene el método to_dict()
    return jsonify([p.to_dict() for p in products]), 200


@api_bp.route('/quotations', methods=['POST'])
def create_quotation():
    """Crea una nueva cotización con items."""
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
        
        # Procesar items si existen
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
        # Necesitarás un método to_dict() en Quotation también
        return jsonify({'message': 'Quotation created successfully'}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'An error occurred', 'details': str(e)}), 500
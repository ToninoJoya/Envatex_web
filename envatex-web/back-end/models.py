# models.py
from app import db
from datetime import datetime

# Modelo de Producto
class Product(db.Model):
    __tablename__ = 'products'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=True)
    sku = db.Column(db.String(50), unique=True, nullable=True)
    image_url = db.Column(db.String(255), nullable=True)

    def to_dict(self):
        """Convierte el objeto Product en un diccionario serializable."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'sku': self.sku,
            'image_url': self.image_url
        }
    

# Modelo de Cotización
class Quotation(db.Model):
    __tablename__ = 'quotations'
    id = db.Column(db.Integer, primary_key=True)
    customer_name = db.Column(db.String(100), nullable=False)
    customer_email = db.Column(db.String(100), nullable=False)
    customer_phone = db.Column(db.String(20), nullable=True)
    status = db.Column(db.String(20), nullable=False, default='Pending')
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    admin_response = db.Column(db.Text, nullable=True)
    
    # Relación con los items de la cotización
    items = db.relationship('QuotationItem', backref='quotation', cascade="all, delete-orphan")
    
    def to_dict(self):
        return {
            'id': self.id,
            'customer_name': self.customer_name,
            'customer_email': self.customer_email,
            'customer_phone': self.customer_phone,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'admin_response': self.admin_response,
            'items': [item.to_dict() for item in self.items],
        }

# Modelo de Items de la Cotización (tabla intermedia)
class QuotationItem(db.Model):
    __tablename__ = 'quotation_items'
    id = db.Column(db.Integer, primary_key=True)
    quantity = db.Column(db.Integer, nullable=False)
    
    # Llaves foráneas
    quotation_id = db.Column(db.Integer, db.ForeignKey('quotations.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)

    # Relación para acceder fácilmente al producto desde un item
    product = db.relationship('Product')
    
    def to_dict(self):
        return {
            'id': self.id,
            'quantity': self.quantity,
            'quotation_id': self.quotation_id,
            'product_id': self.product_id,
        }
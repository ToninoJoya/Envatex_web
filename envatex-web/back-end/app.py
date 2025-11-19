# backend/app.py

import os
from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager

# Cargar variables de entorno desde el archivo .env
load_dotenv()

# ---------------------------------------------------------------------------- #
# Instanciación de Extensiones
# ---------------------------------------------------------------------------- #
# Creamos las instancias de las extensiones fuera del factory.
# De esta manera, pueden ser importadas por otros módulos (como models.py)
# sin causar importaciones circulares.
db = SQLAlchemy()
migrate = Migrate()


# ---------------------------------------------------------------------------- #
# Application Factory
# ---------------------------------------------------------------------------- #
def create_app():
    """
    Función factory para crear y configurar la aplicación Flask.
    Este patrón permite tener múltiples instancias de la app con diferentes
    configuraciones, lo cual es ideal para testing y escalabilidad.
    """
    app = Flask(__name__)

    # --- Configuración de la Aplicación ---
    # Se establece la URL de la base de datos desde una variable de entorno.
    # Si no se encuentra, se usa una base de datos SQLite local por defecto.
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///app.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # --- Inicialización de Extensiones ---
    # Se conectan las extensiones instanciadas previamente con la aplicación.
    db.init_app(app)
    migrate.init_app(app, db)
    # Configurar JWT
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret')
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', app.config['SECRET_KEY'])
    jwt = JWTManager(app)
    
    # Configura CORS para permitir peticiones desde nuestro frontend de React
    # (que se ejecutará en un origen diferente, ej: http://localhost:3000)
    # EJEMPLO - USA LA URL DE TU FRONTEND
    CORS(app)

    # --- Importación y Registro de Modelos ---
    # Es crucial que los modelos se importen después de inicializar db
    # y dentro del contexto de la aplicación para que SQLAlchemy los reconozca.
    with app.app_context():
        from models import Product, Quotation, QuotationItem
    # --- Registro de Rutas (Blueprints) ---
    # Aquí es donde conectaremos nuestros archivos de rutas más adelante.
    # Por ejemplo: from routes.products import products_bp
    #            app.register_blueprint(products_bp, url_prefix='/api')

    # --- Registro de Rutas (Blueprints) ---
    # Importar y registrar el blueprint de la API si existe.
     # --- Registro de Rutas (Blueprints) ---
    from api.routes import api_bp
    app.register_blueprint(api_bp)

    # --- Auto-crear usuario admin si se solicita (solo para desarrollo) ---
    if os.getenv('AUTO_CREATE_ADMIN', 'false').lower() == 'true':
        admin_user = os.getenv('ADMIN_USER')
        admin_pass = os.getenv('ADMIN_PASSWORD')
        if admin_user and admin_pass:
            with app.app_context():
                try:
                    from models import User
                    existing = User.query.filter_by(username=admin_user).first()
                    if not existing:
                        u = User(username=admin_user)
                        u.set_password(admin_pass)
                        db.session.add(u)
                        db.session.commit()
                        print(f"Created admin user '{admin_user}' via AUTO_CREATE_ADMIN")
                except Exception as e:
                    print('AUTO_CREATE_ADMIN failed:', e)

    @app.route('/api/health')
    def health_check():
        return jsonify({'status': 'ok', 'message': 'Envatex API is healthy!'})

    return app

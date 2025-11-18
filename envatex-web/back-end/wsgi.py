# backend/wsgi.py

from app import create_app

# Llama a la función factory para crear la instancia de la aplicación
app = create_app()

# Este bloque permite ejecutar la aplicación directamente con 'python wsgi.py'
if __name__ == "__main__":
    app.run()
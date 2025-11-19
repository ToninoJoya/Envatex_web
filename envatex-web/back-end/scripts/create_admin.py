#!/usr/bin/env python3
"""Script pequeño para crear o actualizar un usuario admin.

Ejecutar desde la carpeta `back-end`:
    python scripts/create_admin.py --username admin --password secreto

Esto crea la tabla si no existe y añade/actualiza el usuario.
"""
import os
import argparse
from app import create_app, db

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--username', required=True)
    parser.add_argument('--password', required=True)
    args = parser.parse_args()

    app = create_app()
    with app.app_context():
        # Import here so models see db
        from models import User
        db.create_all()

        user = User.query.filter_by(username=args.username).first()
        if not user:
            user = User(username=args.username)
            user.set_password(args.password)
            db.session.add(user)
            db.session.commit()
            print(f"Admin user '{args.username}' created.")
        else:
            user.set_password(args.password)
            db.session.commit()
            print(f"Admin user '{args.username}' updated (password changed).")

if __name__ == '__main__':
    main()

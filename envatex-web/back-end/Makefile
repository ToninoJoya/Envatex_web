.PHONY: install start dev help

help:
	@echo "Comandos disponibles:"
	@echo "  make install    - Instala todas las dependencias"
	@echo "  make start      - Inicia el servidor Flask"
	@echo "  make dev        - Inicia el servidor Flask en modo debug"

install:
	pip install -r requirements.txt

start:
	flask run --host=0.0.0.0

dev:
	flask run --host=0.0.0.0 --debug

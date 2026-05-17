# Makefile for Clinical Storage System Backend

.PHONY: help setup install dev test lint format clean migrate seed docker-up docker-down docker-logs

# Default target
help:
	@echo "Clinical Storage System - Backend Commands"
	@echo ""
	@echo "Setup:"
	@echo "  make setup        - Initial project setup"
	@echo "  make install      - Install Python dependencies"
	@echo ""
	@echo "Development:"
	@echo "  make dev          - Start development environment"
	@echo "  make test         - Run all tests"
	@echo "  make test-cov     - Run tests with coverage"
	@echo "  make lint         - Run linting checks"
	@echo "  make format       - Format code with black"
	@echo ""
	@echo "Database:"
	@echo "  make migrate      - Run Alembic migrations"
	@echo "  make migrate-new  - Create new migration"
	@echo "  make seed         - Seed initial data"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-up    - Start all Docker services"
	@echo "  make docker-down  - Stop all Docker services"
	@echo "  make docker-logs  - View Docker logs"
	@echo "  make docker-build - Build Docker images"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean        - Clean generated files"

# Setup
setup:
	@echo "Setting up project..."
	python3.11 -m venv venv
	@echo "Activate venv with: source venv/bin/activate"
	@echo "Then run: make install"

install:
	pip install --upgrade pip
	pip install -r requirements.txt

# Development
# postgres-master redis rabbitmq
dev:
	docker compose --env-file .env.dev up -d 
	@echo "Infrastructure services started"
	@echo "Run services individually with uvicorn"


dev-rebuild:
	@read -p "service name: " name; \
	docker compose --env-file .env.dev up -d --build $$name
	@echo "Infrastructure services started"
	@echo "Run services individually with uvicorn"

test:
	pytest -v

test-cov:
	pytest --cov=common --cov=auth-service --cov=core-api --cov-report=html --cov-report=term

lint:
	flake8 common/ auth-service/ core-api/ rfid-service/ workflow-engine/ notification-service/ reporting-service/ audit-service/
	mypy common/ --ignore-missing-imports

format:
	black common/ auth-service/ core-api/ rfid-service/ workflow-engine/ notification-service/ reporting-service/ audit-service/
	isort common/ auth-service/ core-api/ rfid-service/ workflow-engine/ notification-service/ reporting-service/ audit-service/

# Database
migrate:
	cd database && alembic upgrade head

migrate-new:
	@read -p "Migration name: " name; \
	cd database && alembic revision --autogenerate -m "$$name"

migrate-down:
	cd database && alembic downgrade -1

seed:
	python -m scripts.seed_data

# Docker
docker-up:
	docker compose --env-file .env.prod up -d

docker-down:
	docker compose down

docker-down-v:
	docker compose down -v

docker-logs:
	docker compose logs -f

docker-build:
	docker compose build

docker-rebuild:
	docker compose up -d --build

# Health checks
health:
	@echo "Checking services health..."
	@curl -s http://localhost:8000/health || echo "Auth service: DOWN"
	@curl -s http://localhost:8001/health || echo "Core API: DOWN"
	@curl -s http://localhost:8002/health || echo "RFID service: DOWN"
	@curl -s http://localhost:8003/health || echo "Workflow engine: DOWN"
	@curl -s http://localhost:8004/health || echo "Notification service: DOWN"
	@curl -s http://localhost:8005/health || echo "Reporting service: DOWN"
	@curl -s http://localhost:8006/health || echo "Audit service: DOWN"

# Cleanup
clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".mypy_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "htmlcov" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name ".coverage" -delete 2>/dev/null || true
	@echo "Cleaned up generated files"

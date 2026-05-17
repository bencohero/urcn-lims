#!/bin/sh
set -e

echo "Running database migrations..."
alembic upgrade head

echo "Seeding database..."
# python -m app.scripts.seed_data

echo "Done."
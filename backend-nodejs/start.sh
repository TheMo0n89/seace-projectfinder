#!/bin/sh

echo "Esperando a que la base de datos esté disponible..."
until nc -z db 5432; do
  sleep 1
done
echo "Base de datos disponible"

echo "Migrando modelos a la base de datos..."
node src/scripts/migrate.js || echo "✓ Migración de modelos omitida - Las tablas ya están creadas por scripts SQL."

echo "Creando usuarios iniciales..."
node src/scripts/init-users.js

echo "Iniciando el servidor Node.js..."
node src/server.js

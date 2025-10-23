#!/bin/sh
# Script de inicio para el backend de Node.js

# Esperar a que la base de datos esté disponible
echo "Esperando a que la base de datos esté disponible..."

# Función para verificar si la base de datos está disponible
check_db() {
  node -e "
    const { Client } = require('pg');
    const client = new Client({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });
    
    client.connect()
      .then(() => {
        console.log('Base de datos disponible');
        client.end();
        process.exit(0);
      })
      .catch(e => {
        console.error('Error al conectar con la base de datos:', e);
        client.end();
        process.exit(1);
      });
  "
  return $?
}

# Esperar hasta que la base de datos esté disponible
until check_db; do
  echo "Esperando a la base de datos... Reintentando en 5 segundos..."
  sleep 5
done

# Migrar modelos
echo "Migrando modelos a la base de datos..."
node src/scripts/migrate.js

# Crear usuarios iniciales
echo "Creando usuarios iniciales..."
node src/scripts/init-users.js

# Iniciar el servidor
echo "Iniciando el servidor Node.js..."
node src/server.js
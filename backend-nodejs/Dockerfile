FROM node:18-alpine

# Crear directorio de la aplicación
WORKDIR /app

# Instalar dependencias de Puppeteer para Chromium
RUN apk update && apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    nodejs \
    yarn \
    netcat-openbsd

# Configurar variables para Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copiar package.json
COPY package*.json ./

# Instalar dependencias
RUN npm install --production

# Copiar archivos del proyecto
COPY . .

# Crear directorios necesarios
RUN mkdir -p logs

# Exponer puerto
EXPOSE 8000

# Dar permisos de ejecución al script de inicio
RUN chmod +x ./start.sh

# Comando para iniciar la aplicación
CMD ["/bin/sh", "./start.sh"]
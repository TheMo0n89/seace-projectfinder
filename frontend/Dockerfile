FROM node:18-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY . .

# Recibir variables de entorno como ARG para el build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Construir aplicación
RUN npm run build

# Servir con nginx
FROM nginx:alpine
COPY --from=0 /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

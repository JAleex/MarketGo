# ── Etapa 1: Build de la aplicación React ────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Etapa 2: Servir con Nginx (imagen final ligera) ───────────────────────────
FROM nginx:alpine AS production

# Copiar el build generado por Vite
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuración de Nginx para React Router (SPA)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

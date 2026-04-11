# ─── Stage 1: build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Instala dependências primeiro (camada cacheável separada do código)
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# Copia o restante do código e gera o build de produção
COPY frontend/ .
RUN npm run build

# ─── Stage 2: produção ────────────────────────────────────────────────────────
FROM nginx:alpine

# Remove a configuração padrão do Nginx e substitui pela customizada
RUN rm /etc/nginx/conf.d/default.conf
COPY --from=builder /app/nginx.conf /etc/nginx/conf.d/default.conf

# Copia os arquivos gerados pelo Vite
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

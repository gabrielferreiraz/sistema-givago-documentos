# ─── Stage 1: build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Instala dependências primeiro (camada cacheável separada do código)
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# Copia o restante do código e gera o build de produção
COPY frontend/ .

# Declara os build args recebidos do EasyPanel e os expõe como variáveis
# de ambiente para que o Vite os embutas no bundle estático
ARG VITE_N8N_WEBHOOK_URL
ARG VITE_N8N_WEBHOOK_TOKEN
ARG VITE_PDF_TIMEOUT_MS=90000
ENV VITE_N8N_WEBHOOK_URL=$VITE_N8N_WEBHOOK_URL
ENV VITE_N8N_WEBHOOK_TOKEN=$VITE_N8N_WEBHOOK_TOKEN
ENV VITE_PDF_TIMEOUT_MS=$VITE_PDF_TIMEOUT_MS

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

# Sistema de Geração de PDF — Givago

Interface web para geração automática de orçamentos e contratos em PDF.

## Como funciona

```
[Interface Web] → POST JSON → [N8N Webhook]
                                    ↓
                          Renderiza template HTML (página 5)
                          com PNG do layout como fundo
                                    ↓
                          Gotenberg gera PDF da página editada
                                    ↓
                          Merge: páginas estáticas + página 5 gerada
                                    ↓
                          URL do PDF final → interface exibe download
```

---

## Setup do Frontend

### 1. Instalar dependências

```bash
cd frontend
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` com os valores reais:

```env
VITE_N8N_WEBHOOK_URL=https://seu-n8n.dominio.com/webhook/givago-pdf
VITE_N8N_WEBHOOK_TOKEN=seu_token_secreto
VITE_APP_PASSWORD=sua_senha_de_acesso
```

### 3. Rodar em desenvolvimento

```bash
npm run dev
# Acesse: http://localhost:3000
```

### 4. Build para produção

```bash
npm run build
# Arquivos gerados em: frontend/dist/
```

Sirva a pasta `dist/` com Nginx, Caddy ou qualquer servidor estático.

---

## Deploy na VPS

### Exemplo com Nginx

```nginx
server {
    listen 80;
    server_name documentos.givago.com.br;

    root /var/www/givago-pdf/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Com HTTPS (Certbot)

```bash
certbot --nginx -d documentos.givago.com.br
```

---

## Configuração do N8N

### Webhook esperado

- **URL:** configurada em `VITE_N8N_WEBHOOK_URL`
- **Método:** POST
- **Header:** `Authorization: Bearer SEU_TOKEN`
- **Content-Type:** `application/json`

### Payload recebido (orçamento)

```json
{
  "tipo": "orcamento",
  "numero": "ORC-2024-001",
  "nome_contratante": "João Silva",
  "cpf_cnpj": "123.456.789-00",
  "telefone": "(67) 99999-9999",
  "nome_evento": "Festa de Casamento",
  "data_evento": "2024-06-15",
  "horario_inicio": "20:00",
  "horario_fim": "00:00",
  "local_evento": "Chácara Exemplo",
  "cidade_estado": "Campo Grande - MS",
  "valor_cache": 3500.00,
  "forma_pagamento": "50% antecipado + 50% no dia",
  "observacoes": "Sistema de som incluso",
  "data_validade": "2024-05-25"
}
```

### Payload recebido (contrato)

Mesmo campos do orçamento, mais:
- `data_assinatura` (substituindo `data_validade`)
- `clausulas_especiais`

### Resposta esperada do N8N

```json
{
  "status": "success",
  "pdf_url": "https://vps.dominio.com/storage/givago/ORC-2024-001.pdf",
  "nome_arquivo": "Orcamento-Givago-ORC-2024-001.pdf"
}
```

---

## Templates HTML (Página 5)

Os templates ficam em `templates/`:

- `template-pagina5-orcamento.html`
- `template-pagina5-contrato.html`

### Fluxo no N8N para gerar o PDF

1. N8N recebe o webhook
2. Lê o arquivo do template HTML
3. Substitui as variáveis `{{campo}}` pelos valores recebidos
4. Chama Gotenberg: `POST /forms/chromium/convert/url` ou `/forms/chromium/convert/html`
5. Usa `/forms/pdfengines/merge` para unir:
   - `/storage/givago/paginas-estaticas-orcamento-1-4.pdf` (páginas 1–4)
   - PDF gerado da página 5
   - `/storage/givago/paginas-estaticas-orcamento-6-7.pdf` (páginas 6–7)
6. Salva o PDF final em `/storage/givago/` e retorna a URL

### Calibrar as coordenadas dos campos

1. Exporte a página 5 do PDF original como PNG (150–300 DPI)
2. Salve em `/storage/givago/pagina5-orcamento.png` (e `pagina5-contrato.png`)
3. Abra o template HTML no Chrome
4. Use o DevTools (Inspecionar → move elementos) para ajustar `top/left` de cada `.campo`
5. Atualize os valores no arquivo de template

### Fontes

Se o layout usar uma fonte específica, inclua via `@font-face` no `<style>` do template:

```css
@font-face {
  font-family: 'NomeDaFonte';
  src: url('/storage/givago/fonts/NomeDaFonte.woff2') format('woff2');
}

body {
  font-family: 'NomeDaFonte', sans-serif;
}
```

---

## Estrutura do projeto

```
sistema-contratos-givago/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── PasswordGate.jsx      # Tela de senha
│   │   │   ├── TypeSelector.jsx      # Escolha orçamento/contrato
│   │   │   ├── FormOrcamento.jsx     # Formulário de orçamento
│   │   │   ├── FormContrato.jsx      # Formulário de contrato
│   │   │   ├── LoadingState.jsx      # Tela de carregamento
│   │   │   └── ResultadoPDF.jsx      # Tela de download/WhatsApp
│   │   ├── utils/
│   │   │   └── form.js               # Formatações (moeda, CPF, tel)
│   │   ├── App.jsx                   # Orquestração de estados
│   │   ├── main.jsx
│   │   └── index.css                 # Tailwind + estilos globais
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .env.example
├── templates/
│   ├── template-pagina5-orcamento.html
│   └── template-pagina5-contrato.html
└── README.md
```

---

## Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `VITE_N8N_WEBHOOK_URL` | URL completa do webhook N8N |
| `VITE_N8N_WEBHOOK_TOKEN` | Token de autenticação (enviado no header `Authorization: Bearer`) |
| `VITE_APP_PASSWORD` | Senha de acesso à interface |

> **Importante:** variáveis com prefixo `VITE_` ficam expostas no bundle do frontend. Não use tokens de alto privilégio — o token do webhook deve ser exclusivo para esse endpoint.

# 🔬 Yoleni Design de Processos Químicos

**Plataforma inteligente de análise química e design de processos com Inteligência Artificial.**

![Sistema Yoleni](https://img.shields.io/badge/Status-Pronto_para_Produção-e91e8c?style=for-the-badge)
![IA](https://img.shields.io/badge/IA-GPT--4-c084fc?style=for-the-badge)
![React](https://img.shields.io/badge/Frontend-React_18-61dafb?style=for-the-badge)
![Node](https://the-badge)img.shields.io/badge/Backend-Node.js_Express-339933?style=for-

---

## 📋 Índice

- [Funcionalidades](#funcionalidades)
- [Estrutura do Projeto](#estrutura)
- [Instalação Local](#instalação-local)
- [Configuração](#configuração)
- [Deploy Gratuito](#deploy-gratuito)
- [API Reference](#api-reference)

---

## ✨ Funcionalidades

- 🤖 **Análise com IA (GPT-4)** — Identifica substâncias e sugere processos otimizados
- 📊 **Dashboard Científico** — Tabelas detalhadas com propriedades, custos e impacto ambiental
- 💡 **Processos Sugeridos** — 3 tipos: Otimizado, Baixo Custo e Eco Friendly
- 📁 **Upload CSV/Excel** — Importe listas de substâncias de arquivos
- 📋 **Histórico de Análises** — Todas as análises salvas no MySQL
- 🌿 **Avaliação Ambiental** — Nível de poluição e recomendações sustentáveis
- 💬 **Resposta personalizada** — A IA sempre começa com "Olá Yoleni..."

---

## 🏗️ Estrutura do Projeto

```
chemical-ai-system/
├── frontend/                  # React App
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.jsx            # Componente principal + todos os sub-componentes
│   │   ├── index.js           # Entry point
│   │   └── services/
│   │       └── api.js         # Serviço Axios
│   └── package.json
│
├── backend/                   # Node.js + Express
│   ├── ai/
│   │   └── prompt-engine.js   # Motor de prompts para OpenAI
│   ├── controllers/
│   │   └── analysisController.js
│   ├── routes/
│   │   └── analysis.js
│   ├── database.js            # Conexão MySQL
│   ├── server.js              # Servidor Express
│   ├── package.json
│   └── .env.example
│
└── database/
    └── schema.sql             # Script de criação do banco
```

---

## 🚀 Instalação Local

### Pré-requisitos

- Node.js 18+ ([nodejs.org](https://nodejs.org))
- MySQL 8.0+ ([mysql.com](https://www.mysql.com/downloads/))
- Conta OpenAI com API Key ([platform.openai.com](https://platform.openai.com))

### Passo 1 — Banco de Dados

```bash
# Entre no MySQL
mysql -u root -p

# Execute o script de criação
SOURCE /caminho/para/chemical-ai-system/database/schema.sql;

# Verifique
USE yoleni_chemical;
SHOW TABLES;
```

### Passo 2 — Backend

```bash
cd chemical-ai-system/backend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
```

Edite o `.env`:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=SUA_SENHA_MYSQL
DB_NAME=yoleni_chemical
OPENAI_API_KEY=sk-sua-chave-openai-aqui
FRONTEND_URL=http://localhost:3000
```

```bash
# Rodar em desenvolvimento
npm run dev

# ✅ Backend rodando em http://localhost:5000
```

### Passo 3 — Frontend

```bash
cd chemical-ai-system/frontend

# Instalar dependências
npm install

# Opcional: criar .env.local para customizar URL da API
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env.local

# Rodar
npm start

# ✅ Frontend rodando em http://localhost:3000
```

### Passo 4 — Testar

Acesse `http://localhost:3000` e insira:
```
NaOH, HCl, NH3, CaCO3, H2SO4, Ethanol
```
Clique em **"Analisar Processo"** e aguarde a mágica! ✨

---

## 🌐 Deploy Gratuito

### Opção A: Railway (Recomendado — Gratuito)

**Backend + MySQL:**
1. Crie conta em [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Selecione a pasta `backend/`
4. Adicione um serviço MySQL no Railway
5. Configure as variáveis de ambiente no painel
6. Railway gera a URL do backend automaticamente

**Frontend:**
1. Crie conta em [vercel.com](https://vercel.com)
2. Import GitHub → selecione pasta `frontend/`
3. Em Environment Variables, adicione:
   - `REACT_APP_API_URL` = URL do backend Railway

### Opção B: Render (Gratuito com limitações)

**Backend:**
1. [render.com](https://render.com) → New Web Service
2. Conecte repositório, root: `backend/`
3. Build: `npm install` | Start: `node server.js`
4. Adicione variáveis de ambiente

**Frontend:**
1. New Static Site → pasta `frontend/`
2. Build: `npm run build` | Publish: `build`

### Opção C: Heroku + Netlify

```bash
# Backend no Heroku
cd backend
heroku create yoleni-chemical-api
heroku config:set OPENAI_API_KEY=sk-...
heroku config:set DB_HOST=...
git push heroku main

# Frontend no Netlify
cd frontend
npm run build
# Arraste a pasta build/ para netlify.com/drop
```

### Banco de Dados Gratuito na Nuvem

Use **PlanetScale** (MySQL gratuito):
1. [planetscale.com](https://planetscale.com) → Create Database
2. Obtenha a connection string
3. Configure no `.env`: `DB_HOST`, `DB_USER`, `DB_PASSWORD`

---

## 📡 API Reference

### POST `/api/analyze`
Analisa substâncias via IA.

**Body:**
```json
{
  "substances_input": "NaOH, HCl, NH3",
  "title": "Minha análise"
}
```

**Resposta:**
```json
{
  "success": true,
  "analysis_id": 1,
  "data": {
    "greeting": "Olá Yoleni, ...",
    "substances": [...],
    "suggested_processes": [...],
    "summary": {...}
  }
}
```

### POST `/api/analyze/file`
Analisa arquivo CSV ou Excel (multipart/form-data).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| file | File | .csv, .xlsx ou .xls |

### GET `/api/history`
Lista últimas 20 análises.

### GET `/api/analysis/:id`
Busca análise por ID.

### GET `/api/health`
Health check do servidor.

---

## 🎨 Customização

### Cores do tema (App.jsx)
```javascript
const COLORS = {
  rose: '#e91e8c',      // Cor primária (rosa)
  mauve: '#c084fc',     // Cor secundária (lilás)
  deepPurple: '#1a0a2e' // Fundo principal
};
```

### Modelo de IA (analysisController.js)
```javascript
model: 'gpt-4o',  // Troque por 'gpt-3.5-turbo' para reduzir custos
```

---

## 📝 Notas Técnicas

- **Rate Limiting**: 20 requisições por 15 minutos (proteção da API OpenAI)
- **Arquivo máximo**: 5MB para CSV/Excel
- **Substâncias máximas**: 50 por análise
- **Timeout da IA**: 2 minutos para processar
- **Banco offline**: O sistema funciona sem MySQL (análises não são salvas)

---

## 💜 Desenvolvido para Yoleni

*Sistema especializado em Engenharia Química com IA de última geração.*

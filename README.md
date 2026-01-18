# Controlador de Renda 💸⏱️

Aplicação pessoal para **controlar tempo trabalhado e renda a receber** por “trabalhos” (ex: *Sprint Y do Trabalho X*), com:
- **Timer acumulado por trabalho** (não zera entre sessões)
- **Logs de sessões** (cada start/stop vira um registro)
- **Dashboard** com totais do dia / semana / mês
- **Encerrar trabalho** + bloqueio automático após o prazo final

> Stack: **FastAPI + PostgreSQL (Aiven) + React (Vite) + TypeScript + TailwindCSS**.

---

## ✨ Funcionalidades

### ✅ Autenticação
- Registro de usuário
- Login com **JWT Bearer**
- Rotas protegidas no backend e no frontend

### ✅ Trabalhos
- Criar um trabalho com:
  - `title` (ex: “Trabalho X”)
  - `sprint_name` (ex: “Sprint Y”)
  - `start_date` e `end_date` (YYYY-MM-DD)
  - `hourly_rate_cents` (ex: 3500 = R$35,00/h)
  - `currency` (BRL)
- Listar trabalhos do usuário

### ✅ Timer (por trabalho)
- Start / stop de sessão
- Somatório de tempo fechado + sessão aberta (se existir)
- Estado do timer:
  - `running`
  - `started_at`
  - `total_closed_seconds`
  - **bloqueio de trabalho**: `is_finished` / `blocked_reason` (`CLOSED` ou `EXPIRED`)

### ✅ Logs (sessões)
- Lista das sessões com:
  - início / fim
  - duração em segundos
  - “rodando” quando ainda está aberta

### ✅ Encerrar trabalho + expiração
- Endpoint para encerrar manualmente (`close`)
- Se passar do `end_date`, o sistema bloqueia o start
- Mensagem padrão de bloqueio: **“esse trabalho já terminou”**

### ✅ Dashboard / Relatórios
- Cards:
  - Hoje
  - Últimos 7 dias
  - Últimos 30 dias
- Ranking “Top trabalhos” do mês:
  - tempo total por trabalho
  - valor total a receber por trabalho

---

## 🧱 Arquitetura e Monorepo

Este repositório é um **monorepo** com backend e frontend no mesmo lugar:

controlador-de-renda/
apps/
backend/ # FastAPI + SQLAlchemy + Alembic
frontend/ # React + Vite + TS + Tailwind

### Por que monorepo?
- Mais simples para evoluir e versionar
- Deploys independentes continuam possíveis no futuro
- Compartilhamento de documentação e padrões

---

## 🗃️ Modelo de dados (Postgres)

Principais entidades:

- **users**
  - id, email, name, password_hash, created_at
- **works**
  - id, user_id, title, sprint_name, start_date, end_date
  - hourly_rate_cents, currency
  - closed_at, closed_reason
- **time_entries**
  - id, work_id, user_id
  - started_at, ended_at

Regras:
- Um trabalho pertence a um usuário
- Cada sessão de timer vira um `time_entry`
- Pode existir no máximo **1 sessão aberta** por trabalho

---

## 🔌 API (principais rotas)

> Prefixos podem variar conforme seu projeto, mas o MVP implementado segue este padrão.

### Auth
- `POST /auth/register`
- `POST /auth/login` → retorna `{ access_token }`

### Works
- `POST /works` → cria trabalho
- `GET /works` → lista trabalhos
- `POST /works/{work_id}/close` → encerra trabalho

### Timer
- `POST /works/{work_id}/timer/start`
- `POST /works/{work_id}/timer/stop`
- `GET /works/{work_id}/timer` → estado (inclui bloqueio e datas)
- `GET /works/{work_id}/entries` → logs (sessões)

### Reports
- `GET /reports/summary?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD`

---

## 🖥️ Frontend (React + TS + Tailwind)

Páginas:
- `/login` → login
- `/dashboard` → resumo e top trabalhos
- `/works` → criar e listar trabalhos
- `/works/:id` → timer acumulado + logs + encerrar trabalho

UX importante:
- Se `is_finished === true`, o botão **Start** fica desabilitado e mostra:
  - “Esse trabalho já terminou”
  - `blocked_reason` = `CLOSED` ou `EXPIRED`

---

## ⚙️ Como rodar localmente

### Pré-requisitos
- Node.js 18+ (recomendado 20+)
- Python 3.11+
- PostgreSQL (local) **ou** Aiven (cloud)

---

## 1) Backend (FastAPI)

### Configurar env
Crie `apps/backend/.env` (ou use seu padrão de config):

Exemplo:
```env
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST:PORT/DBNAME
JWT_SECRET_KEY=super-secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

CORS_ORIGINS=http://localhost:5173
```

Instalar dependências
```bash
cd apps/backend
python -m venv .venv
# Windows:
.\.venv\Scripts\activate
pip install -r requirements.txt
```

Migrations
```bash
alembic upgrade head
```

Rodar API
```bash
uvicorn app.api.main:app --reload --host 0.0.0.0 --port 8000
```

Swagger:

http://localhost:8000/docs

2) Frontend (Vite + Tailwind v4)
Configurar env
Crie apps/frontend/.env:
```env
VITE_API_BASE_URL=http://localhost:8000
```

Instalar dependências
```bash
cd apps/frontend
npm install
npm run dev
```

🧩 TailwindCSS (v4) — configuração (referência)
Tailwind v4 não usa tailwindcss init.

Dependências:
```bash
npm install -D tailwindcss @tailwindcss/postcss autoprefixer
```

postcss.config.js:
```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
    autoprefixer: {},
  },
};
```

src/index.css:
```css
@import "tailwindcss";
```

E garantir:
```ts
import "./index.css";
```

## ✅ Fluxo de uso (na prática)

- **Criar conta**: (/auth/register no Swagger)
- **Logar no front**: (/login)
- **Criar um “Trabalho”**
- **Abrir o trabalho** e rodar o timer (Start/Stop)
- **Ver sessões** e total acumulado
- **Ver dashboard** (dia / semana / mês)
- **Encerrar o trabalho** quando acabar

---

## 🚧 Roadmap (ideias fáceis de adicionar)

- **Estado do work** na lista (ativo / encerrado / expirado)
- **Filtro no dashboard** por work
- **Export CSV/PDF** (relatório mensal)
- **Metas** (ex: “30h na sprint”)
- **Notificação/alerta** se timer estiver rodando há X horas
- **Deploy** (Render/Fly.io) + Front (Vercel)

---

## 🛡️ Segurança e boas práticas

- **JWT Bearer** para rotas privadas
- **Validação de ownership**: usuário só acessa seus próprios works e entries
- **Bloqueio no backend** (não depende do front)

---

## 📄 Licença

Uso pessoal / MVP (defina a licença quando for publicar).

---

## 👤 Autor

Gabriel Rosa — projeto pessoal para controle de tempo e renda.
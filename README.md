# 🧠 Multi-Tenant RAG Platform

A production-grade MERN application with LangChain.js, Pinecone, and Google Gemini API. Each organization gets its own private AI knowledge base with strict tenant isolation.

## ✨ Features

| Feature | Details |
|---|---|
| **Multi-Tenancy** | Per-org Pinecone namespaces — data never cross-contaminates |
| **Role-Based Access** | `admin` uploads docs & manages users; `user` queries only |
| **RAG Fusion** | 3 query variants → parallel retrieval → Reciprocal Rank Fusion |
| **Recursive Chunking** | `RecursiveCharacterTextSplitter` with semantic-boundary separators |
| **Grounded Constraints** | LLM system prompt forces citation-only answers |
| **JWT Auth** | Token carries `userId`, `role`, `orgId`, `orgNamespace` |
| **Async Processing** | Document upload returns immediately; embedding runs in background |

---

## 📁 Project Structure

```
multitanent-rag/
├── server/                         # Express + Node.js (ESM)
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js               # MongoDB connection
│   │   │   ├── pinecone.js         # Pinecone client + index getter
│   │   │   └── gemini.js           # Gemini embeddings + LLM
│   │   ├── models/
│   │   │   ├── Organization.model.js
│   │   │   ├── User.model.js
│   │   │   └── Document.model.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js   # JWT verify + requireAdmin guard
│   │   │   ├── error.middleware.js  # Global error handler
│   │   │   └── upload.middleware.js # Multer (memory storage)
│   │   ├── services/
│   │   │   ├── chunking.service.js  # RecursiveCharacterTextSplitter
│   │   │   ├── embedding.service.js # Gemini embed → Pinecone upsert
│   │   │   ├── document.service.js  # PDF/TXT extraction pipeline
│   │   │   └── rag.service.js       # RAG Fusion + RRF + generation
│   │   ├── controllers/             # Auth, Org, Document, Chat
│   │   ├── routes/                  # Express routers
│   │   └── index.js                 # Entry point
│   ├── .env                         # ← Fill in your keys
│   └── package.json
└── client/                          # React 18 + Vite + Tailwind
    ├── src/
    │   ├── api/axios.js             # Axios with JWT interceptor
    │   ├── context/AuthContext.jsx  # Auth state + login/logout
    │   ├── components/              # Navbar, LoadingSpinner
    │   ├── pages/
    │   │   ├── HomePage.jsx         # Public landing page
    │   │   ├── RegisterOrgPage.jsx  # Org registration form
    │   │   ├── LoginPage.jsx
    │   │   ├── AdminDashboard.jsx   # Doc upload + user management
    │   │   └── UserDashboard.jsx    # Chat interface with citations
    │   └── App.jsx                  # Routes + guards
    └── package.json
```

---

## 🚀 Setup Guide

### 1. Prerequisites
- Node.js >= 18
- MongoDB running locally (`mongod`) or a MongoDB Atlas URI
- Pinecone account
- Google AI Studio account (Gemini API)

### 2. Get Your API Keys

#### Pinecone
1. Go to https://www.pinecone.io → Create account
2. Create an **index** named `multitenant-rag`
   - **Dimensions**: `768` (Gemini `text-embedding-004` output)
   - **Metric**: `cosine`
3. Copy your **API Key** from the dashboard

#### Gemini API
1. Go to https://aistudio.google.com → Get API Key
2. Copy the key

### 3. Configure Environment

Edit `server/.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/multitenant_rag
JWT_SECRET=generate_a_long_random_string_here
JWT_EXPIRES_IN=7d
PINECONE_API_KEY=<your_pinecone_api_key>
PINECONE_INDEX=multitenant-rag
GEMINI_API_KEY=<your_gemini_api_key>
CLIENT_URL=http://localhost:5173
```

Generate a JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Start the Application

Open **two terminals**:

```bash
# Terminal 1 — Backend
cd "server"
npm run dev

# Terminal 2 — Frontend
cd "client"
npm run dev
```

Open http://localhost:5173

---

## 🔐 User Flows

### Flow 1: Register Organization (Public)
1. Visit `/` → Click **Register Your Organization**
2. Fill in org name + admin credentials
3. Redirected to login

### Flow 2: Admin
1. Login → redirected to `/admin`
2. Upload PDF/TXT/Markdown documents
3. Documents are chunked → embedded → stored in Pinecone (org namespace)
4. Manage team members (invite, activate/deactivate)

### Flow 3: User
1. Login → redirected to `/dashboard`
2. Ask questions in the chat interface
3. RAG pipeline: query variants → retrieval → RRF → Gemini generation
4. Answer with source citations (expandable)

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | Public | Login, returns JWT |
| GET | `/api/auth/me` | Bearer | Get current user |

### Organizations
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/organizations/register` | Public | Register org + first admin |
| GET | `/api/organizations/stats` | Bearer | Org stats |
| POST | `/api/organizations/users` | Admin | Invite user |
| GET | `/api/organizations/users` | Admin | List org users |
| PATCH | `/api/organizations/users/:id/toggle` | Admin | Activate/deactivate user |

### Documents
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/documents` | Bearer | List org documents |
| POST | `/api/documents` | Admin | Upload document (multipart) |
| GET | `/api/documents/:id` | Bearer | Get document details |
| DELETE | `/api/documents/:id` | Admin | Delete + remove from Pinecone |

### Chat
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/chat` | Bearer | `{ query }` → RAG response |

---

## 🧠 RAG Pipeline

```
User Query
    │
    ▼
Generate 3 query variants (Gemini)
    │
    ▼
Retrieve top-5 for each variant in parallel (Pinecone, org namespace)
    │
    ▼
Reciprocal Rank Fusion — merge & re-rank all results
    │
    ▼
Build grounded context (top-5 fused chunks)
    │
    ▼
Gemini gemini-1.5-flash with strict system prompt
    │
    ▼
Answer + Source Citations
```

**Grounded Constraints (system prompt rules):**
- Answer ONLY from provided context
- Cite source document + chunk index
- Refuse if answer not in docs
- No hallucination or external knowledge

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6 |
| Backend | Node.js, Express 4, ESM modules |
| Database | MongoDB + Mongoose |
| Vector DB | Pinecone (namespaced per org) |
| AI / LLM | Google Gemini 1.5 Flash |
| Embeddings | Gemini text-embedding-004 (768 dims) |
| RAG Framework | LangChain.js |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| File Upload | Multer (memory storage) |

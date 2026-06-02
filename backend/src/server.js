import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRouter from "./modules/users/routes/userRouter.js"
import characterRouter from "./modules/characters/routes/characterRouter.js";
import authRouter from "./modules/auth/routes/authRouter.js";
import socialRouter from "./modules/social/routes/socialRouter.js";
import chatRouter from "./modules/chat/routes/chatRouter.js";
import discoveryRouter from "./modules/discovery/routes/discoveryRouter.js";
import { initializeRedis } from "./config/redis.js";

dotenv.config();

// ==========================================
// VALIDAÇÃO DE SEGURANÇA EM STARTUP
// ==========================================
if (!process.env.JWT_SECRET) {
  console.error('❌ ERRO CRÍTICO: JWT_SECRET não configurado em .env');
  console.error('   Adicione JWT_SECRET=sua_chave_secreta_muito_longa no arquivo .env');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

// ==========================================
// CONFIGURAÇÃO DE CORS RESTRITIVO (VIA .ENV)
// ==========================================
// Lê do .env: CORS_ORIGINS=http://localhost:5173,https://personia.vercel.app
const corsOriginsEnv = process.env.CORS_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:5173';
const allowedOrigins = corsOriginsEnv
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

if (allowedOrigins.length === 0) {
  console.error('❌ Nenhuma origem CORS configurada em .env');
  process.exit(1);
}

console.log(`✅ CORS configurado para: ${allowedOrigins.join(', ')}`);

app.use(cors({
  origin: (origin, callback) => {
    // Permite requisições sem origin (como mobile apps ou server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS rejeitado para origem: ${origin}`);
      callback(new Error('CORS não permitido para esta origem'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Access-Token']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Routes
app.use("/users", userRouter);
app.use("/character", characterRouter);
app.use("/auth", authRouter);
app.use("/social", socialRouter);
app.use("/chat", chatRouter);
app.use("/discovery", discoveryRouter);

// ==========================================
// MIDDLEWARE DE ERRO GLOBAL
// ==========================================
app.use((err, req, res, next) => {
  console.error('❌ Erro não tratado:', err.message);
  res.status(500).json({ 
    erro: 'Erro interno do servidor',
    mensagem: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ==========================================
// INICIALIZAÇÃO DO SERVIDOR
// ==========================================
async function startServer() {
  try {
    // Inicializar Redis
    const redisOk = await initializeRedis();
    if (!redisOk) {
      console.warn('⚠️ Servidor iniciando sem Redis (cache desabilitado)');
    }
    
    // Iniciar servidor HTTP
    app.listen(PORT, () => {
      console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
      console.log(`📍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('❌ Erro fatal ao inicializar servidor:', err);
    process.exit(1);
  }
}

startServer();

export default app;
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import helmet from "helmet";
import csrf from "csurf";
import session from "express-session";
import { RedisStore } from "connect-redis";
import userRouter from "./modules/users/routes/userRouter.js";
import characterRouter from "./modules/characters/routes/characterRouter.js";
import authRouter from "./modules/auth/routes/authRouter.js";
import socialRouter from "./modules/social/routes/socialRouter.js";
import chatRouter from "./modules/chat/routes/chatRouter.js";
import missionsRouter from "./modules/missions/router/missionsRouter.js";
import discoveryRouter from "./modules/discovery/routes/discoveryRouter.js";
import ratingsRouter from "./modules/ratings/routes/ratingsRouter.js";
import { initializeRedis, getRedisClient } from "./config/redis.js";
import { initializeDatabase } from "./config/db.js";
import cookieRouter from "./modules/cookies/routes/cookieRouter.js";
import { sanitizeCookieHeaders } from "./middleware/cookieConsent.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger.js";
dotenv.config();

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = process.env.NODE_ENV === 'production' ? '' : 'dev-jwt-secret-change-me';
}

// ==========================================
// VALIDAÇÃO DE SEGURANÇA EM STARTUP
// ==========================================
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.error('❌ ERRO CRÍTICO: JWT_SECRET não configurado em .env');
  console.error('   Adicione JWT_SECRET=sua_chave_secreta_muito_longa no arquivo .env');
  process.exit(1);
}

const app = express();
app.disable('x-powered-by');
const PORT = Number(process.env.PORT || 3001);
const sessionSecret = process.env.SESSION_SECRET || (process.env.NODE_ENV === 'production' ? null : 'dev-session-secret-change-me');

if (!sessionSecret && process.env.NODE_ENV === 'production') {
  console.error('❌ SESSION_SECRET não configurado para produção');
  process.exit(1);
}

// Documentação da API
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// ==========================================
// PROCESSAMENTO DE ORIGENS CORS (VIA .ENV)
// ==========================================
const corsOriginsEnv = process.env.CORS_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:3000,http://localhost:5173';
const allowedOrigins = corsOriginsEnv
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

if (allowedOrigins.length === 0) {
  console.error('❌ Nenhuma origem CORS configurada em .env');
  process.exit(1);
}

// ==========================================
// CONFIGURAÇÃO DE CORS RESTRITIVO (NO TOPO)
// ==========================================
// ✅ CORRIGIDO: Ativado logo no início para processar as requisições antes dos outros middlewares
app.use(cors({
  origin: (origin, callback) => {
    // Permite requisições sem origin (como mobile apps, postman ou server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS rejeitado para origem: ${origin}`);
      callback(new Error('CORS não permitido para esta origem'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Access-Token', 'X-CSRF-Token', 'x-anon-id', 'x-guest-id']
}));

// ==========================================
// SEGURANÇA: HELMET.JS (Headers de Segurança HTTP)
// ==========================================
// ✅ AJUSTADO: Adicionado localhost:3000 e 3002 no connectSrc para evitar bloqueios de scripts
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://generativelanguage.googleapis.com", "http://localhost:3000", "http://localhost:3002"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"],
    },
  },
  hsts: { 
    maxAge: 31536000,      // 1 ano
    includeSubDomains: true,
    preload: true
  },
  frameguard: { 
    action: 'deny'         // Previne clickjacking
  },
  noSniff: true,           // Previne MIME sniffing
  xssFilter: true,         // Proteção XSS (browsers antigos)
  referrerPolicy: { 
    policy: 'strict-origin-when-cross-origin' 
  }
}));

// ==========================================
// SEGURANÇA: SESSION + CSRF PROTECTION
// ==========================================
const redisClient = getRedisClient();

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  name: 'eikon.sid',
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Middleware CSRF - protege rotas POST/PUT/DELETE (Usa session, não cookies)
const csrfProtection = csrf({ cookie: false });  

// Endpoint para obter token CSRF (GET - seguro)
app.get('/csrf-token', csrfProtection, (req, res) => {
  res.json({ 
    csrfToken: req.csrfToken(),
    timestamp: new Date().toISOString()
  });
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());

// ==========================================
// ROTAS DO SISTEMA
// ==========================================
app.use("/users", userRouter);
app.use("/character", characterRouter);
app.use("/auth", authRouter);
app.use("/social", socialRouter);
app.use("/chat", chatRouter);
app.use("/discovery", discoveryRouter);
app.use('/ratings', ratingsRouter);
app.use('/missions', missionsRouter);
// missions routes removed

// ==========================================
// SEGURANÇA: SANITIZAÇÃO DE COOKIES
// ==========================================
app.use(sanitizeCookieHeaders);

// ROTAS DE GERENCIAMENTO DE COOKIES
app.use('/api/cookies', cookieRouter);

// ==========================================
// MIDDLEWARE DE ERRO GLOBAL
// ==========================================
app.use((err, req, res, next) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (!isDevelopment) {
    console.error('❌ Erro:', {
      code: err.code || 'UNKNOWN',
      timestamp: new Date().toISOString(),
      path: req.path
    });
  } else {
    console.error('❌ Erro não tratado:', err);
  }
  
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ 
      erro: 'CSRF validation failed',
      code: 'EBADCSRFTOKEN'
    });
  }
  
  res.status(err.status || 500).json({ 
    erro: isDevelopment ? err.message : 'Erro interno do servidor',
    code: err.code || 'INTERNAL_SERVER_ERROR',
    ...(isDevelopment && { stack: err.stack })
  });
});

export { csrfProtection };

// ==========================================
// INICIALIZAÇÃO DO SERVIDOR
// ==========================================
async function startServer() {
  try {
    await initializeDatabase();
  } catch (err) {
    console.warn('⚠️ Banco indisponível; o servidor continuará sem depender do banco para rotas públicas de autenticação:', err.message);
  }

  try {
    const redisOk = await initializeRedis();
    if (!redisOk) {
      console.warn('⚠️ Servidor iniciando sem Redis (cache desabilitado)');
    }
    
    app.listen(PORT, () => {
      const environment = process.env.NODE_ENV || 'development';
      console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
      console.log(`📍 Ambiente: ${environment}`);
      console.log(`🔒 Segurança: Helmet.js ativado, CSRF protegido, Session com Redis`);
      console.log(`✅ CORS configurado para: ${allowedOrigins.join(', ')}`);
      
      if (environment === 'production') {
        console.log('🚀 MODO PRODUÇÃO - Erros detalhados desabilitados');
      }
    });
  } catch (err) {
    console.error('❌ Erro fatal ao inicializar servidor:', err);
    process.exit(1);
  }
}

startServer();

export default app;
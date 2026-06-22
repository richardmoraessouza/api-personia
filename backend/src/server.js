import express from "express";
import cors from "cors";
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
import discoveryRouter from "./modules/discovery/routes/discoveryRouter.js";
import ratingsRouter from "./modules/ratings/routes/ratingsRouter.js";
import { initializeRedis, getRedisClient } from "./config/redis.js";
import cookieRouter from "./modules/cookies/routes/cookieRouter.js";
import { sanitizeCookieHeaders } from "./middleware/cookieConsent.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger.js";
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
const PORT = 3001;

// Documentação da API
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

// ==========================================
// PROCESSAMENTO DE ORIGENS CORS (VIA .ENV)
// ==========================================
const corsOriginsEnv = process.env.CORS_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:5173';
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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Access-Token', 'X-CSRF-Token']
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
  secret: process.env.SESSION_SECRET || 'change-me-in-production-now',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',  // HTTPS only em produção
    httpOnly: true,                                   // Não acessível via JavaScript
    sameSite: 'strict',                              // CSRF protection
    maxAge: 24 * 60 * 60 * 1000                      // 24 horas
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
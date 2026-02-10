import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import router from "./router.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Log simples de todas as requisições (útil para diagnosticar Render)
app.use((req, res, next) => {
  console.log(`[REQ] ${new Date().toISOString()} ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  next();
});

app.use(cors())

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Rotas
app.use("/", router);

// Health check (útil para Render e debug)
app.get('/health', (req, res) => {
  const hasKeys = !!(process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY2 || process.env.GEMINI_KEYS);
  res.json({ status: 'ok', port: PORT, geminiKeysPresent: hasKeys });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

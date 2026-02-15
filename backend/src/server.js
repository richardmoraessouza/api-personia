import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import router from "./router.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors())

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Rotas
app.use("/", router);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

export default app;
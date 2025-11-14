
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import router from "./router.js";

dotenv.config();

const PORT = process.env.PORT || 3000;

const app = express();

app.use(cors({
  origin: 'https://persoia.netlify.app',
  credentials: true
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
console.log("teste")
app.use("/", router);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import router from "./router.js";

dotenv.config();

const PORT = 3000;
const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.use("/", router);

app.listen(PORT, () => console.log(`Servidor rodando na porta http://localhost:${PORT}`));

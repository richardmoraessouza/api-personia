import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRouter from "./modules/users/routes/userRouter.js"
import characterRouter from "./modules/characters/routes/characterRouter.js";
import authRouter from "./modules/auth/routes/authRouter.js";
import socialRouter from "./modules/social/routes/socialRouter.js";
import chatRouter from "./modules/chat/routes/chatRouter.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors())

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Rotas
app.use("/users", userRouter);
app.use("/character", characterRouter);
app.use("/auth", authRouter);
app.use("/social", socialRouter);
app.use("/chat", chatRouter);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

export default app;
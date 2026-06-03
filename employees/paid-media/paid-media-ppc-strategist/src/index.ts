import express, { Express, Request, Response } from "express";
import cors from "cors";
import { persona } from "./persona.js";
import chatRouter from "./routes/chat.js";

const app: Express = express();
const PORT = 5012;

app.use(cors());
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "healthy",
    agent: persona.name,
    port: PORT,
    color: persona.color,
    emoji: persona.emoji,
    vibe: persona.vibe
  });
});

app.use("/api/chat", chatRouter);

app.listen(PORT, () => {
  console.log(`🚀 ${persona.name} agent running on port ${PORT}`);
  console.log(`   ${persona.emoji} ${persona.vibe}`);
});

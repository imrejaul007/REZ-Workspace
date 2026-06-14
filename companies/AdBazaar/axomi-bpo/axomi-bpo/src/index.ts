import "dotenv/config";
import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { env } from "./config.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { bpoRoutes } from "./routes/bpo.js";

const app = express();

// ── Global middleware ──────────────────────────────────────────────────

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(requestLogger);

// ── Health check ──────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "@axom/axomi-bpo",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ── API routes ────────────────────────────────────────────────────────

app.use("/api/bpo", bpoRoutes);

// ── Error handler ─────────────────────────────────────────────────────

app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────────────

app.listen(env.PORT, () => {
  logger.info(`[START] Axomi BPO listening on port ${env.PORT}`);
  logger.info(`[ENV]   NODE_ENV=${env.NODE_ENV}`);
});

export default app;

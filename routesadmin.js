import express from "express";
import { getCallLogs } from "../services/logger.js";

const router = express.Router();

let adminConfig = {
  systemPrompt: process.env.BOT_SYSTEM_PROMPT || "You are a helpful AI assistant."
};

function auth(req, res, next) {
  const secret = req.headers["x-admin-secret"];
  if (secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

router.get("/config", auth, (req, res) => {
  res.json(adminConfig);
});

router.post("/config", auth, express.json(), (req, res) => {
  const { systemPrompt } = req.body;

  if (systemPrompt) {
    adminConfig.systemPrompt = systemPrompt;
    process.env.BOT_SYSTEM_PROMPT = systemPrompt;
  }

  res.json({
    success: true,
    config: adminConfig
  });
});

router.get("/logs", auth, (req, res) => {
  res.json(getCallLogs());
});

export default router;
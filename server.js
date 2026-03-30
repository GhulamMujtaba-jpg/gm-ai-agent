import dotenv from "dotenv";
dotenv.config();

import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import http from "http";
import { WebSocketServer } from "ws";

import voiceRoutes from "./routes/voice.js";
import adminRoutes from "./routes/admin.js";
import { handleTwilioMediaStream } from "./services/twilioStreamBridge.js";

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static("public"));

app.use("/voice", voiceRoutes);
app.use("/admin", adminRoutes);

app.get("/", (req, res) => {
  res.send("✅ AI Voice Bot Pro is running");
});

const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (req, socket, head) => {
  if (req.url === "/media-stream") {
    wss.handleUpgrade(req, socket, head, (ws) => {
      handleTwilioMediaStream(ws, req);
    });
  } else {
    socket.destroy();
  }
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
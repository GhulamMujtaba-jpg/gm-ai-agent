import express from "express";
import { VoiceResponse } from "../config/twilio.js";

const router = express.Router();

router.post("/incoming", (req, res) => {
  const response = new VoiceResponse();

  const connect = response.connect();

  connect.stream({
    url: `${process.env.PUBLIC_BASE_URL.replace("https://", "wss://")}/media-stream`
  });

  res.type("text/xml");
  res.send(response.toString());
});

export default router;
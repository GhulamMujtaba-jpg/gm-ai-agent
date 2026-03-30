import WebSocket from "ws";

export function createOpenAIRealtimeSocket({ systemPrompt, onOpen, onMessage, onClose, onError }) {
  const url = "wss://api.openai.com/v1/realtime?model=gpt-4o-mini-realtime-preview";

  const ws = new WebSocket(url, {
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "OpenAI-Beta": "realtime=v1"
    }
  });

  ws.on("open", () => {
    console.log("✅ OpenAI Realtime connected");

    // Session config
    ws.send(JSON.stringify({
      type: "session.update",
      session: {
        modalities: ["audio", "text"],
        instructions: systemPrompt || process.env.BOT_SYSTEM_PROMPT,
        input_audio_format: "g711_ulaw",
        output_audio_format: "g711_ulaw",
        turn_detection: {
          type: "server_vad"
        },
        voice: "alloy"
      }
    }));

    if (onOpen) onOpen(ws);
  });

  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (onMessage) onMessage(msg);
    } catch (err) {
      console.error("OpenAI parse error:", err.message);
    }
  });

  ws.on("close", () => {
    console.log("❌ OpenAI Realtime disconnected");
    if (onClose) onClose();
  });

  ws.on("error", (err) => {
    console.error("OpenAI Realtime error:", err.message);
    if (onError) onError(err);
  });

  return ws;
}
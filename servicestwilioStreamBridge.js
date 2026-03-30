import { createOpenAIRealtimeSocket } from "./openaiRealtime.js";
import { saveCallLog } from "./logger.js";

export function handleTwilioMediaStream(twilioWs, req) {
  let streamSid = null;
  let callSid = null;
  let callerNumber = null;
  let aiSocket = null;
  let transcript = [];

  console.log("📞 Twilio media stream connected");

  aiSocket = createOpenAIRealtimeSocket({
    systemPrompt: process.env.BOT_SYSTEM_PROMPT,

    onMessage: (msg) => {
      // Debug:
      // console.log("OpenAI Event:", msg.type);

      // AI audio chunk -> send back to Twilio
      if (msg.type === "response.audio.delta" && msg.delta && streamSid) {
        twilioWs.send(JSON.stringify({
          event: "media",
          streamSid,
          media: {
            payload: msg.delta
          }
        }));
      }

      // Optional mark for better playback control
      if (msg.type === "response.audio.done" && streamSid) {
        twilioWs.send(JSON.stringify({
          event: "mark",
          streamSid,
          mark: {
            name: "ai-response-complete"
          }
        }));
      }

      // User transcript
      if (msg.type === "conversation.item.input_audio_transcription.completed") {
        transcript.push({
          role: "user",
          text: msg.transcript
        });
        console.log("👤 User:", msg.transcript);
      }

      // Assistant transcript
      if (msg.type === "response.audio_transcript.done") {
        transcript.push({
          role: "assistant",
          text: msg.transcript
        });
        console.log("🤖 AI:", msg.transcript);
      }
    }
  });

  twilioWs.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      switch (msg.event) {
        case "connected":
          console.log("Twilio stream connected event");
          break;

        case "start":
          streamSid = msg.start.streamSid;
          callSid = msg.start.callSid;
          callerNumber = msg.start.customParameters?.from || "Unknown";

          console.log("▶️ Stream started:", streamSid);
          console.log("📲 Call SID:", callSid);
          break;

        case "media":
          // Twilio -> OpenAI audio
          if (aiSocket && aiSocket.readyState === 1) {
            aiSocket.send(JSON.stringify({
              type: "input_audio_buffer.append",
              audio: msg.media.payload
            }));
          }
          break;

        case "dtmf":
          console.log("DTMF:", msg.dtmf?.digit);
          break;

        case "stop":
          console.log("⏹️ Stream stopped");

          saveCallLog({
            callSid,
            callerNumber,
            transcript
          });

          if (aiSocket && aiSocket.readyState === 1) {
            aiSocket.close();
          }

          try {
            twilioWs.close();
          } catch {}
          break;

        default:
          break;
      }
    } catch (err) {
      console.error("Twilio WS parse error:", err.message);
    }
  });

  twilioWs.on("close", () => {
    console.log("❌ Twilio WS closed");

    saveCallLog({
      callSid,
      callerNumber,
      transcript
    });

    if (aiSocket && aiSocket.readyState === 1) {
      aiSocket.close();
    }
  });

  twilioWs.on("error", (err) => {
    console.error("Twilio WS error:", err.message);
  });
}
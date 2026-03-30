import fs from "fs";
import path from "path";

const logFilePath = path.join(process.cwd(), "data", "callLogs.json");

function ensureLogFile() {
  const dir = path.dirname(logFilePath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(logFilePath)) {
    fs.writeFileSync(logFilePath, "[]", "utf8");
  }
}

export function saveCallLog(log) {
  ensureLogFile();

  try {
    const raw = fs.readFileSync(logFilePath, "utf8");
    const logs = JSON.parse(raw);
    logs.push({
      ...log,
      createdAt: new Date().toISOString()
    });
    fs.writeFileSync(logFilePath, JSON.stringify(logs, null, 2), "utf8");
  } catch (err) {
    console.error("Error saving call log:", err.message);
  }
}

export function getCallLogs() {
  ensureLogFile();

  try {
    const raw = fs.readFileSync(logFilePath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading logs:", err.message);
    return [];
  }
}
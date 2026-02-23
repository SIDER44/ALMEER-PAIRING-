const express = require("express");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(express.static("public"));

if (!fs.existsSync("./sessions")) {
  fs.mkdirSync("./sessions");
}

app.post("/pair", async (req, res) => {
  const number = req.body.number;
  if (!number) return res.json({ status: false, message: "Number required" });

  const sessionId = "ALMEER_XMD_" + uuidv4().slice(0, 8);
  const sessionPath = path.join(__dirname, "sessions", sessionId);

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    browser: ["ALMEER XMD", "Chrome", "1.0"]
  });

  sock.ev.on("creds.update", saveCreds);

  try {
    const code = await sock.requestPairingCode(number);

    res.json({
      status: true,
      code: code,
      sessionId: sessionId
    });
  } catch (e) {
    res.json({ status: false, message: e.message });
  }
});

app.listen(process.env.PORT || 3000, () =>
  console.log("ALMEER Pairing Server Running")
);

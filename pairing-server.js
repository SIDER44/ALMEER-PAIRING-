const express = require("express");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());
app.use(express.static("public"));

/* Create sessions folder */
if (!fs.existsSync("./sessions")) {
  fs.mkdirSync("./sessions");
}

app.post("/pair", async (req, res) => {
  try {
    let number = req.body.number;

    if (!number) {
      return res.json({ status: false, message: "Enter number" });
    }

    // Clean number
    number = number.replace(/[^0-9]/g, "");

    // Unique session per user (VERY IMPORTANT)
    const sessionId = "ALMEER_XMD_" + uuidv4().slice(0, 6);
    const sessionPath = path.join("./sessions", sessionId);

    const {
      default: makeWASocket,
      useMultiFileAuthState,
      fetchLatestBaileysVersion
    } = require("@whiskeysockets/baileys");

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      browser: ["Ubuntu", "Chrome", "120.0"], // More trusted
      printQRInTerminal: false,
      syncFullHistory: false,
      markOnlineOnConnect: false
    });

    sock.ev.on("creds.update", saveCreds);

    // 🔥 IMPORTANT: Warm up socket (fix Render failures)
    await new Promise(r => setTimeout(r, 4000));

    // Request pairing code
    const code = await sock.requestPairingCode(number);

    // Return result
    res.json({
      status: true,
      code: code,
      sessionId: sessionId
    });

    console.log("Pairing requested:", number, sessionId);

  } catch (e) {
    console.log("Pairing error:", e.message);
    res.json({ status: false, message: e.message });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("🔥 ALMEER Render Pairing Server Running");
});

const express = require("express");
const app = express();

app.use(express.json());
app.use(express.static("public"));

app.post("/pair", async (req, res) => {
  try {
    let number = req.body.number;

    if (!number) {
      return res.json({ status: false, message: "Enter number" });
    }

    number = number.replace(/[^0-9]/g, "");

    const {
      default: makeWASocket,
      useMultiFileAuthState,
      fetchLatestBaileysVersion
    } = require("@whiskeysockets/baileys");

    const { state, saveCreds } = await useMultiFileAuthState("./temp-session");
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      browser: ["ALMEER XMD", "Chrome", "1.0"],
      printQRInTerminal: false,
      syncFullHistory: false
    });

    sock.ev.on("creds.update", saveCreds);

    const code = await sock.requestPairingCode(number);

    res.json({
      status: true,
      code: code
    });

  } catch (e) {
    res.json({ status: false, message: e.message });
  }
});

app.listen(process.env.PORT || 3000, () =>
  console.log("Pairing server running")
);

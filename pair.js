const express = require('express');
const router = express.Router();
const { default: makeWASocket, useMultiFileAuthState, delay } = require("@whiskeysockets/baileys");
const pino = require("pino");

router.get('/', async (req, res) => {
    const number = req.query.number;
    if(!number) return res.send({error: "Number eka danna!"});

    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    
    try {
        let sock = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            logger: pino({ level: "fatal" }),
            browser: ["RANUMITHA-X-MD", "Chrome", "1.0.0"]
        });

        if (!sock.authState.creds.registered) {
            await delay(1500);
            let code = await sock.requestPairingCode(number);
            res.send({ code: code });
        }

        sock.ev.on('creds.update', saveCreds);
    } catch (err) {
        res.send({ error: "Connection Error" });
    }
});

module.exports = router;

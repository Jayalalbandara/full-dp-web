const express = require('express');
const router = express.Router();
const { default: makeWASocket, useMultiFileAuthState, delay, makeCacheableSignalKeyStore } = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require('fs');

router.get('/', async (req, res) => {
    const number = req.query.number;
    if(!number) return res.send({error: "Number is required"});

    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    
    try {
        let sock = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
            },
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
        sock.ev.on('connection.update', (update) => {
            const { connection } = update;
            if (connection === "open") {
                console.log("Connected for pairing...");
            }
        });
    } catch (err) {
        res.send({ error: "Service Error" });
    }
});

module.exports = router;

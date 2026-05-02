const express = require('express');
const router = express.Router();
const { default: makeWASocket, useMultiFileAuthState, delay, makeCacheableSignalKeyStore } = require("@whiskeysockets/baileys");
const pino = require("pino");
const { generateSession } = require('./gen-id');

router.get('/', async (req, res) => {
    const number = req.query.number;
    if(!number) return res.send({error: "Number eka oni!"});

    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    
    try {
        let sock = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
            },
            logger: pino({ level: "fatal" }),
            browser: ["RANUMITHA-X-MD", "Chrome", "1.0.0"]
        });

        if (!sock.authState.creds.registered) {
            await delay(1500);
            let code = await sock.requestPairingCode(number);
            res.send({ code: code });
        }

        sock.ev.on('creds.update', saveCreds);
        
        sock.ev.on('connection.update', async (update) => {
            const { connection } = update;
            if (connection === "open") {
                const email = process.env.MEGA_EMAIL;
                const password = process.env.MEGA_PASSWORD;
                if(email && password) {
                    await generateSession('auth_info', email, password);
                }
            }
        });
    } catch (err) {
        res.send({ error: "Internal Error" });
    }
});

module.exports = router;

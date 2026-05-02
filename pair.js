const express = require('express');
const router = express.Router();
const { default: makeWASocket, useMultiFileAuthState, delay, makeCacheableSignalKeyStore, Browsers } = require("@whiskeysockets/baileys");
const pino = require("pino");
const { generateSession } = require('./gen-id');

router.get('/', async (req, res) => {
    let number = req.query.number;
    if(!number) return res.send({error: "Number eka danna!"});
    number = number.replace(/[^0-9]/g, '');

    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    
    try {
        let sock = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
            },
            printQRInTerminal: false,
            logger: pino({ level: "fatal" }),
            browser: Browsers.macOS("Desktop"), // Browser eka macOS walata wenas kara
            syncFullHistory: false // Speed eka wadi karanna
        });

        if (!sock.authState.creds.registered) {
            await delay(2000);
            let code = await sock.requestPairingCode(number);
            res.send({ code: code });
        }

        sock.ev.on('creds.update', saveCreds);
        
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
            
            if (connection === "open") {
                console.log("WhatsApp Connected Successfully!");
                
                // Mega credentials ganna
                const email = process.env.MEGA_EMAIL;
                const password = process.env.MEGA_PASSWORD;
                
                // Podi delay ekak denawa data save wenna
                await delay(5000);
                
                if(email && password) {
                    await generateSession('auth_info', email, password);
                }
            }

            if (connection === "close") {
                let reason = lastDisconnect?.error?.output?.statusCode;
                console.log("Connection closed, reason:", reason);
            }
        });
    } catch (err) {
        res.send({ error: "Error: " + err.message });
    }
});

module.exports = router;

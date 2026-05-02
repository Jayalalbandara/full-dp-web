const express = require('express');
const router = express.Router();
const { default: makeWASocket, useMultiFileAuthState, delay, makeCacheableSignalKeyStore, Browsers } = require("@whiskeysockets/baileys");
const pino = require("pino");
const { generateSession } = require('./gen-id');

router.get('/', async (req, res) => {
    let number = req.query.number;
    if(!number) return res.send({error: "Number eka oni!"});
    
    // Number eka suddha kireema (Spaces/Plus marks ain kireema)
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
            // Browser identity eka fix kireema - Request eka enna meka wadagath
            browser: Browsers.ubuntu("Chrome") 
        });

        if (!sock.authState.creds.registered) {
            await delay(2000); // Server ekata ready wenna podi welawak
            let code = await sock.requestPairingCode(number);
            
            if (!code) {
                return res.send({ error: "Code eka ganna bari una. Ayeth try karanna." });
            }
            res.send({ code: code });
        }

        sock.ev.on('creds.update', saveCreds);
        
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === "open") {
                console.log("WhatsApp Connected!");
                const email = process.env.MEGA_EMAIL;
                const password = process.env.MEGA_PASSWORD;
                if(email && password) {
                    await generateSession('auth_info', email, password);
                }
            }
        });
    } catch (err) {
        console.error(err);
        res.send({ error: "Internal Error: " + err.message });
    }
});

module.exports = router;

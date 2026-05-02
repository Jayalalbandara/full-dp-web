const express = require('express');
const path = require('path');
const bodyParser = require("body-parser");
const multer = require('multer');
const Jimp = require('jimp');
const fs = require('fs-extra');
const { default: makeWASocket, useMultiFileAuthState, delay } = require('@whiskeysockets/baileys');
const pino = require('pino');

const app = express();
const PORT = process.env.PORT || 8000;
const pairRoute = require('./pair');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const upload = multer({ dest: 'uploads/' });

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'main.html')));
app.get('/pair', (req, res) => res.sendFile(path.join(__dirname, 'pair.html')));
app.use('/code', pairRoute);

app.post('/upload-dp', upload.single('image'), async (req, res) => {
    const { number } = req.body;
    if (!req.file) return res.send("<h1>Photo ekak select karanna!</h1>");
    
    const imagePath = req.file.path;
    const authFolder = path.join(__dirname, 'auth_info');

    if (!fs.existsSync(path.join(authFolder, 'creds.json'))) {
        return res.send("<h1>Kalin Step 01 gihin Link karala inna!</h1>");
    }

    try {
        const { state, saveCreds } = await useMultiFileAuthState(authFolder);
        const sock = makeWASocket({
            auth: state,
            logger: pino({ level: 'fatal' }),
            browser: ["RANUMITHA-X-MD", "Chrome", "1.0.0"]
        });

        sock.ev.on('creds.update', saveCreds);
        sock.ev.on('connection.update', async (update) => {
            const { connection } = update;
            if (connection === 'open') {
                const jid = number.includes('@s.whatsapp.net') ? number : `${number}@s.whatsapp.net`;
                
                const img = await Jimp.read(imagePath);
                const buffer = await img.getBufferAsync(Jimp.MIME_JPEG);
                
                await sock.updateProfilePicture(jid, buffer);
                await delay(3000);
                await sock.logout();
                
                fs.removeSync(imagePath);
                fs.removeSync(authFolder);
                res.send("<h1>Success! DP Updated & Logged Out.</h1>");
            }
        });
    } catch (e) { res.send("Error: " + e.message); }
});

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

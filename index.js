const express = require('express');
const bodyParser = require("body-parser");
const path = require('path');
const multer = require('multer');
const Jimp = require('jimp');
const fs = require('fs');
const app = express();

const PORT = process.env.PORT || 8000;
const pairRoute = require('./pair');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const upload = multer({ dest: 'uploads/' });

// Serve HTML files
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '/main.html')));
app.get('/pair', (req, res) => res.sendFile(path.join(__dirname, '/pair.html')));

// Session Route
app.use('/code', pairRoute);

// Full DP Logic
app.post('/upload-dp', upload.single('image'), async (req, res) => {
    try {
        const { number } = req.body;
        const imagePath = req.file.path;
        const sessionPath = path.join(__dirname, 'auth_info', 'creds.json');

        if (!fs.existsSync(sessionPath)) return res.send("Nikanma DP danna ba, kalin scan karala inna!");

        const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
        const { state } = await useMultiFileAuthState('auth_info');
        const sock = makeWASocket({ auth: state, logger: require('pino')({ level: 'fatal' }) });

        sock.ev.on('connection.update', async (update) => {
            if (update.connection === 'open') {
                const jid = number.includes('@s.whatsapp.net') ? number : `${number}@s.whatsapp.net`;
                const img = await Jimp.read(imagePath);
                const buffer = await img.getBufferAsync(Jimp.MIME_JPEG);
                await sock.updateProfilePicture(jid, buffer);
                res.send("DP eka සාර්ථකව update una!");
            }
        });
    } catch (e) { res.send("Error: " + e.message); }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

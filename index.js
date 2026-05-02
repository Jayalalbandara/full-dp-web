const express = require('express');
const multer = require('multer');
const Jimp = require('jimp');
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

let sock;

// 1. WhatsApp Connection eka hadanna
async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    sock = makeWASocket({
        auth: state,
        printQRInTerminal: true, // QR eka terminal eke penawa
        logger: pino({ level: 'silent' })
    });
    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', (update) => {
        const { connection } = update;
        if (connection === 'open') console.log('WhatsApp Connected!');
    });
}

// 2. Full DP logic එක
async function getFullDPBuffer(imagePath) {
    const image = await Jimp.read(imagePath);
    const size = Math.max(image.getWidth(), image.getHeight());
    const canvas = new Jimp(size, size, 0xffffffff); // Sudu background
    
    canvas.composite(image, (size - image.getWidth()) / 2, (size - image.getHeight()) / 2);
    return await canvas.getBufferAsync(Jimp.MIME_JPEG);
}

// 3. Web UI එක
app.get('/', (req, res) => {
    res.send(`
        <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
            <h2>WhatsApp Full DP Uploader</h2>
            <form action="/upload" method="post" enctype="multipart/form-data">
                <input type="text" name="number" placeholder="94712345678" required><br><br>
                <input type="file" name="image" accept="image/*" required><br><br>
                <button type="submit" style="padding: 10px 20px; cursor: pointer;">Update Profile Picture</button>
            </form>
        </div>
    `);
});

// 4. Upload handling
app.post('/upload', upload.single('image'), async (req, res) => {
    try {
        const num = req.body.number + "@s.whatsapp.net";
        const buffer = await getFullDPBuffer(req.file.path);
        
        await sock.updateProfilePicture(num, buffer);
        
        fs.unlinkSync(req.file.path); // Temp file eka delete karanna
        res.send("<h1>DP eka update una!</h1><a href='/'>Back</a>");
    } catch (err) {
        res.send("Error: " + err.message);
    }
});

app.listen(3000, () => {
    console.log('Web server is running on port 3000');
    connectToWhatsApp();
});

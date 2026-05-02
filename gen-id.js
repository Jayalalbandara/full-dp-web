const fs = require('fs-extra');
const path = require('path');
const { uploadToMega } = require('./mega');

async function generateSession(authPath, megaEmail, megaPassword) {
    try {
        const creds = path.join(authPath, 'creds.json');
        
        if (!fs.existsSync(creds)) {
            return { error: "Credentials file not found!" };
        }

        const credsData = fs.readFileSync(creds, 'utf-8');
        const sessionID = Buffer.from(credsData).toString('base64');
        const finalID = "RANUMITHA-X-MD-ID:" + sessionID;

        const tempFile = path.join(__dirname, 'session.txt');
        fs.writeFileSync(tempFile, finalID);

        const megaLink = await uploadToMega(tempFile, megaEmail, megaPassword);
        
        fs.removeSync(tempFile);

        return { id: finalID, link: megaLink };
    } catch (err) {
        console.error("Session Generation Error:", err);
        return { error: err.message };
    }
}

module.exports = { generateSession };

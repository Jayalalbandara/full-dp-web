const { Storage } = require('megajs');
const fs = require('fs');

async function uploadToMega(filePath, email, password) {
    try {
        const storage = await new Storage({
            email: email,
            password: password
        }).ready;

        const fileBuffer = fs.readFileSync(filePath);
        const fileName = filePath.split('/').pop();

        const file = await storage.upload(fileName, fileBuffer).complete;
        const link = await file.link();
        
        return link;
    } catch (error) {
        console.error('Mega Upload Error:', error);
        return null;
    }
}

module.exports = { uploadToMega };

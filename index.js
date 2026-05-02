const express = require('express');
const bodyParser = require("body-parser");
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8000;

// Routes
const pairRoute = require('./pair');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve HTML files
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '/main.html')));
app.get('/pair', (req, res) => res.sendFile(path.join(__dirname, '/pair.html')));
app.get('/full-dp', (req, res) => res.sendFile(path.join(__dirname, '/full-dp.html')));

// Use the pairing logic
app.use('/code', pairRoute);

// Full DP logic can be added here or as a separate route
// (Kalin dunna index.js eke thibba multer/jimp logic eka mekata ekathu karanna)

app.listen(PORT, () => {
    console.log(`RANUMITHA-X-MD Server running on http://localhost:${PORT}`);
});

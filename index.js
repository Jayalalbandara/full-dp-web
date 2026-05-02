const express = require('express');
const path = require('path');
const app = express();
const pairRoute = require('./pair'); // pair.js file eka link kirima

// Static files (HTML) serve kirima
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'main.html'));
});

app.get('/pair', (req, res) => {
    res.sendFile(path.join(__dirname, 'pair.html'));
});

// Pairing route එක use කිරීම
app.use('/code', pairRoute);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

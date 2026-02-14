const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

// nacte css 
app.use(express.static(__dirname));
// nacteni z formulare
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const DATA_FILE = path.join(__dirname, 'filmy.json');

// nacte filmy z json
const nactiData = () => {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (e) { return []; }
};

// ulozi do json
const ulozData = (data) => fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

// seznam
app.get('/items', (req, res) => {
    const filmy = nactiData();
    const s = req.query.search ? req.query.search.toLowerCase() : "";
    const filtrovane = filmy.filter(f => f.nazev.toLowerCase().includes(s));
    res.json(filtrovane);
});

// upraveni
app.get('/get-film/:id', (req, res) => {
    const filmy = nactiData();
    const film = filmy.find(f => f.id == req.params.id);
    if (film) {
        res.json(film);
    } else {
        res.status(404).send('Film nenalezen');
    }
});

// ulozeni upraveni
app.post('/edit/:id', (req, res) => {
    let filmy = nactiData();
    const index = filmy.findIndex(f => f.id == req.params.id);
    if (index !== -1) {
        filmy[index] = { 
            id: Number(req.params.id), 
            nazev: req.body.nazev,
            rok: req.body.rok,
            zanr: req.body.zanr
        };
        ulozData(filmy);
    }
    res.redirect('/');
    
});

// pridani filmu
app.post('/items', (req, res) => {
    const filmy = nactiData();
    filmy.push({ id: Date.now(), ...req.body });
    ulozData(filmy);
    res.redirect('/');
});

// smazani
app.get('/delete/:id', (req, res) => {
    let filmy = nactiData().filter(f => f.id != req.params.id);
    ulozData(filmy);
    res.redirect('/');
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(3000, () => console.log('http://localhost:3000'));
const http = require("http");
const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "filmy.json");

// Načtení dat ze souboru
function loadData() {
    try {
        if (!fs.existsSync(DATA_FILE)) return [];
        const data = fs.readFileSync(DATA_FILE, "utf-8");
        return JSON.parse(data);
    } catch (e) { return []; }
}

// Uložení dat do souboru
function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

const server = http.createServer((req, res) => {
    let filmy = loadData();

    // Hlavní stránka
    if (req.url === "/" && req.method === "GET") {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        return res.end(fs.readFileSync(path.join(__dirname, "index.html")));
    }

    // CSS soubor
    if (req.url === "/style.css") {
        res.writeHead(200, { "Content-Type": "text/css" });
        return res.end(fs.readFileSync(path.join(__dirname, "style.css")));
    }

    // API: Seznam filmů + vyhledávání
    if (req.url.startsWith("/items") && req.method === "GET") {
        const urlParams = new URL(req.url, `http://${req.headers.host}`);
        const s = urlParams.searchParams.get("search") || "";
        const filtrovane = filmy.filter(f => f.nazev.toLowerCase().includes(s.toLowerCase()));
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        return res.end(JSON.stringify(filtrovane));
    }

    // API: Získání jednoho filmu pro editaci
    if (req.url.startsWith("/get-film/") && req.method === "GET") {
        const id = Number(req.url.split("/")[2]);
        const film = filmy.find(f => f.id === id);
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        return res.end(JSON.stringify(film || { error: "Nenalezeno" }));
    }

    // POST: Přidání nebo Editace
    if (req.method === "POST") {
        let body = "";
        req.on("data", chunk => { body += chunk.toString(); });
        req.on("end", () => {
            const data = new URLSearchParams(body);
            const filmData = {
                nazev: data.get("nazev"),
                rok: data.get("rok"),
                zanr: data.get("zanr")
            };

            if (req.url === "/items") {
                const newFilm = { id: Date.now(), ...filmData };
                filmy.push(newFilm);
            } else if (req.url.startsWith("/edit/")) {
                const id = Number(req.url.split("/")[2]);
                const index = filmy.findIndex(f => f.id === id);
                if (index !== -1) filmy[index] = { id, ...filmData };
            }

            saveData(filmy);
            res.writeHead(302, { "Location": "/" });
            res.end();
        });
        return;
    }

    // GET: Mazání (přes odkaz)
    if (req.url.startsWith("/delete/") && req.method === "GET") {
        const id = Number(req.url.split("/")[2]);
        const zbyvajici = filmy.filter(f => f.id !== id);
        saveData(zbyvajici);
        res.writeHead(302, { "Location": "/" });
        return res.end();
    }
});

server.listen(3000, () => console.log("Server běží na http://localhost:3000"));
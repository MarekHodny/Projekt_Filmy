const http = require("http");
const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "filmy.json");


function loadData() {
    try {
        if (!fs.existsSync(DATA_FILE)) return [];
        const data = fs.readFileSync(DATA_FILE, "utf-8");
        return JSON.parse(data);
    } catch (e) { return []; }
}


function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

const server = http.createServer((req, res) => {
    let filmy = loadData();

    if (req.url === "/" && req.method === "GET") {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        return res.end(fs.readFileSync(path.join(__dirname, "index.html")));
    }

   
    if (req.url === "/style.css") {
        res.writeHead(200, { "Content-Type": "text/css" });
        return res.end(fs.readFileSync(path.join(__dirname, "style.css")));
    }

    
   if (req.url.startsWith("/items") && req.method === "GET") {
    const urlParams = new URL(req.url, `http://${req.headers.host}`);
    
    const sNazev = urlParams.searchParams.get("search") || "";
    const sZanr = urlParams.searchParams.get("zanr") || "";
    const sRok = urlParams.searchParams.get("rok") || ""; 

    let filtrovane = filmy.filter(f => {
        const matchNazev = f.nazev.toLowerCase().includes(sNazev.toLowerCase());
        const matchZanr = f.zanr.toLowerCase().includes(sZanr.toLowerCase());
        
        const matchRok = sRok === "" || f.rok == sRok;
        return matchNazev && matchZanr && matchRok;
    });

    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    return res.end(JSON.stringify(filtrovane));
}

    
    if (req.url.startsWith("/get-film/") && req.method === "GET") {
        const id = Number(req.url.split("/")[2]);
        const film = filmy.find(f => f.id === id);
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        return res.end(JSON.stringify(film || { error: "Nenalezeno" }));
    }

    
    if (req.method === "POST") {
        let body = "";
        req.on("data", chunk => { body += chunk.toString(); });
        req.on("end", () => {
            const data = new URLSearchParams(body);
            
            const nazev = data.get("nazev")?.trim();
            const rok = data.get("rok")?.trim();
            const zanr = data.get("zanr")?.trim();
            const url = data.get("url")?.trim();


            if (!nazev || !rok || !zanr) {
                res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
                return res.end("Chyba: Všechna pole musí být vyplněna!");
            }

           
            const filmData = { nazev, rok, zanr, url };

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
    
    if (req.url.startsWith("/delete/") && req.method === "DELETE") {
    const id = Number(req.url.split("/")[2]);
    const zbyvajici = filmy.filter(f => f.id !== id);
    
    saveData(zbyvajici);
    
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ success: true }));
}
});


server.listen(3000, () => console.log("Server běží na http://localhost:3000"));
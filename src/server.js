const express = require("express");
const { DatabaseSync } = require("node:sqlite");
const path = require("node:path");
const { error } = require("node:console");
const { json } = require("node:stream/consumers");


const app = express();
app.use(express.static(path.join(__dirname, "..", "public")));
const PORTA = process.env.PORT || 3000;


const caminhoBanco = process.env.DB_PATH || path.join(__dirname, "..", "dados", "rio.db");
const banco = new DatabaseSync(caminhoBanco, { readOnly: true} );

const consultaParada = banco.prepare(
    "SELECT stop_id, stop_name, stop_lat, stop_lon FROM stops WHERE stop_id = ?"
);

const consultaLinhas = banco.prepare(`
    SELECT DISTINCT r.route_short_name AS numero, r.route_long_name AS nome
    FROM stop_times st
    JOIN trips t ON t.trip_id = st.trip_id
    JOIN routes r ON r.route_id = t.route_id
    WHERE st.stop_id = ?
    ORDER BY r.route_short_name
`);


const consultaCaixa = banco.prepare(`
    SELECT stop_id, stop_name, stop_lat, stop_lon
    FROM stops
    WHERE stop_lat BETWEEN ? AND ?
        AND stop_lon BETWEEN ? AND ?
    `);

function distanciaMetros(lat1, lon1, lat2, lon2) {
    const R = 6371000; 
    const toRad = (valor) => (valor * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const  c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;

}





app.get("/paradas/proximas", (req, res) => {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    const raio = Math.min(Number(req.query.raio ?? 500), 2000);

    if (Number.isNaN(lat) || Number.isNaN(lon) || Number.isNaN(raio)) {
        return res.status(400).json({ erro: "Informe lat e lon como números (raio em metros é opcional)"})
    }

    const grausLat = raio / 111320;
    const grausLon = grausLat / Math.cos((lat * Math.PI) / 180);

    const candidatas = consultaCaixa.all(lat - grausLat, lat + grausLat, lon - grausLon, lon + grausLon);

    const proximas = candidatas
        .map((p) => ({ ...p, distancia_m: Math.round(distanciaMetros(lat, lon, p.stop_lat, p.stop_lon)) }))
        .filter((p) => p.distancia_m <= raio)
        .sort((a, b) => a.distancia_m - b.distancia_m)
        .slice(0, 10);

        res.json(proximas);

});



app.get("/paradas/:id/linhas", (req, res) =>  {
    const linhas = consultaLinhas.all(req.params.id);
    res.json(linhas);
});


app.get("/paradas/:id", (req, res) => {
    const parada = consultaParada.get(req.params.id);

    if (!parada) {
        return res.status(404).json({ erro: "Parada não encontrada" });
    }

    res.json(parada);
});




app.listen(PORTA, () => {
    console.log(`API rodando em http://localhost:${PORTA}`);
});

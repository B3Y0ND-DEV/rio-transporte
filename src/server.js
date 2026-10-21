const express = require("express");
const { DatabaseSync } = require("node:sqlite");
const path = require("node:path");


const app = express();
const PORTA = 3000;


const caminhoBanco = path.join(__dirname, "..", "dados", "rio.db");
const banco = new DatabaseSync(caminhoBanco, { readOnly: true} );

const consultaLinhas = banco.prepare(`
    SELECT DISTINCT r.route_short_name AS numero, r.route_long_name AS nome
    FROM stop_times st
    JOIN trips t ON t.trip_id = st.trip_id
    JOIN routes r ON r.route_id = t.route_id
    WHERE st.stop_id = ?
    ORDER BY r.route_short_name
`);

app.get("/paradas/:id/linhas", (req, res) =>  {
    const linhas = consultaLinhas.all(req.params.id);
    res.json(linhas);
});

app.listen(PORTA, () => {
    console.log(`API rodando em http://localhost:${PORTA}`);
});

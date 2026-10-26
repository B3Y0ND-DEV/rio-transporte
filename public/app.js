const mapa = L.map("mapa").setView([-22.9035, -43.2096], 13);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; Colaboradores do OpenStreetMap | Dados de ônibus: Prefeitura do Rio (Data.Rio), CC-BY",
}).addTo(mapa);

const camada = L.layerGroup().addTo(mapa);

function mostrarAviso(lat, lon, texto) {
    const conteudo = document.createElement("div");
    conteudo.textContent = texto;
    L.popup().setLatLng([lat, lon]).setContent(conteudo).openOn(mapa);
}

async function buscarParadas(lat, lon) {
    try {
        const resposta = await fetch(`/paradas/proximas?lat=${lat}&lon=${lon}&raio=800`);
        if (!resposta.ok) {
            throw new Error(`a API respondeu ${resposta.status}`);
        }
        const paradas = await resposta.json();

        camada.clearLayers();

        if (paradas.length === 0) {
            mostrarAviso(lat, lon, "Nenhuma parada num raio de 800 m");
            return;
        }

        for (const parada of paradas) {
            const texto = document.createElement("div");
            const titulo = `${parada.stop_name} (${parada.distancia_m} m)`;
            texto.textContent = titulo;

            const marcador = L.marker([parada.stop_lat, parada.stop_lon])
                .bindPopup(texto)
                .addTo(camada);

            marcador.on("popupopen", async () => {
                try {
                    const respostaLinhas = await fetch(`/paradas/${encodeURIComponent(parada.stop_id)}/linhas`);
                    const linhas = await respostaLinhas.json();
                    const numeros = linhas.map((linha) => linha.numero).join(", ");

                    texto.textContent = `${titulo} - Linhas: ${numeros || "nenhuma"}`;
                    marcador.getPopup().update();
                } catch (erro) {
                    texto.textContent = `${titulo} - Não foi possível carregar as linhas`;
                }
            });
        }
    } catch (erro) {
        mostrarAviso(lat, lon, `Erro ao buscar paradas: ${erro.message}`);
    }
}

mapa.on("click", (evento) => {
    buscarParadas(evento.latlng.lat, evento.latlng.lng);
});
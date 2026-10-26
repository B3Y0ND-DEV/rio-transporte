const mapa = L.map("mapa").setView([-22.9035, -43.2096], 13);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; Colaboradores do OpenStreetMap | Dados de ônibus: Prefeitura do Rio (Data.Rio), CC-BY",
}).addTo(mapa);

const camada = L.layerGroup().addTo(mapa);

async function buscarParadas(lat, lon) {
    const resposta = await fetch(`/paradas/proximas?lat=${lat}&lon=${lon}&raio=800`);
    const paradas = await resposta.json();

    camada.clearLayer();
    for (const parada of paradas) {
        const texto = document.createElement("div");
        texto.textContent = `${parada.stop_name} (${parada.distancia_m} m)` ;
        L.marker([parada.stop_lat, parada.stop_lon]).bindPopup(texto).addTo(camada);
    }
}

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
      texto.textContent = `${parada.stop_name} (${parada.distancia_m} m)`;
      L.marker([parada.stop_lat, parada.stop_lon]).bindPopup(texto).addTo(camada);
    }
  } catch (erro) {
    mostrarAviso(lat, lon, `Erro ao buscar paradas: ${erro.message}`);
  }
}

mapa.on("click", (evento) => {
    buscarParadas(evento.latlng.lat, evento.latlng.lng);
});

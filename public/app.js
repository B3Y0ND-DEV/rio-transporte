const mapa = L.map("mapa", { zoomControl: false }).setView([-22.9035, -43.2096], 13);
L.control.zoom({ position: "topright" }).addTo(mapa);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; Colaboradores do OpenStreetMap | Dados de ônibus: Prefeitura do Rio (Data.Rio), CC-BY",
}).addTo(mapa);

const camada = L.layerGroup().addTo(mapa);

const elNome = document.getElementById("nome-parada");
const elInfo = document.getElementById("info-parada");
const elLinhas = document.getElementById("linhas");
const botaoLocal = document.getElementById("btn-local");

const iconeNormal = L.divIcon({ className: "parada", iconSize: [18, 18] });
const iconeEscolhido = L.divIcon({ className: "parada escolhida", iconSize: [24, 24] });

let marcadorEscolhido = null;
let pedidoAtual = 0;

function mostrarMensagem(titulo, texto) {
    elNome.textContent = titulo;
    elInfo.textContent = texto;
    elLinhas.replaceChildren();
}

async function selecionarParada(parada, marcador) {
    const meuPedido = ++pedidoAtual;

    if (marcadorEscolhido) marcadorEscolhido.setIcon(iconeNormal);
    marcador.setIcon(iconeEscolhido);
    marcadorEscolhido = marcador;

    mostrarMensagem(parada.stop_name, `${parada.distancia_m} m do ponto escolhido`);

    try {
        const resposta = await fetch(`/paradas/${encodeURIComponent(parada.stop_id)}/linhas`);
        if (!resposta.ok) throw new Error(`a API respondeu ${resposta.status}`);
        const linhas = await resposta.json();
        if (meuPedido !== pedidoAtual) return; // o usuário já escolheu outra parada

        if (linhas.length === 0) {
            elInfo.textContent += " · nenhuma linha encontrada";
            return;
        }
        for (const linha of linhas) {
            const item = document.createElement("li");
            item.textContent = linha.numero;
            elLinhas.appendChild(item);
        }
    } catch (erro) {
        if (meuPedido === pedidoAtual) {
            elInfo.textContent = "Não foi possível carregar as linhas desta parada.";
        }
    }
}

async function buscarParadas(lat, lon) {
    try {
        const resposta = await fetch(`/paradas/proximas?lat=${lat}&lon=${lon}&raio=800`);
        if (!resposta.ok) throw new Error(`a API respondeu ${resposta.status}`);
        const paradas = await resposta.json();

        camada.clearLayers();
        marcadorEscolhido = null;

        L.circleMarker([lat, lon], {
            radius: 7, color: "#111111", weight: 3, fillColor: "#E8E3D6", fillOpacity: 1,
        }).addTo(camada);

        if (paradas.length === 0) {
            pedidoAtual++;
            mostrarMensagem("NENHUMA PARADA", "Não há paradas num raio de 800 m deste ponto.");
            return;
        }

        const marcadores = paradas.map((parada) => {
            const marcador = L.marker([parada.stop_lat, parada.stop_lon], {
                icon: iconeNormal,
                title: parada.stop_name,
            }).addTo(camada);
            marcador.on("click", () => selecionarParada(parada, marcador));
            return marcador;
        });

        // a mais próxima já vem selecionada
        selecionarParada(paradas[0], marcadores[0]);
    } catch (erro) {
        pedidoAtual++;
        mostrarMensagem("ERRO", `Não foi possível buscar as paradas (${erro.message}).`);
    }
}

mapa.on("click", (evento) => {
    buscarParadas(evento.latlng.lat, evento.latlng.lng);
});

botaoLocal.addEventListener("click", () => {
    if (!navigator.geolocation) {
        mostrarMensagem("SEM LOCALIZAÇÃO", "Seu navegador não suporta localização.");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (posicao) => {
            const { latitude, longitude } = posicao.coords;
            mapa.setView([latitude, longitude], 16);
            buscarParadas(latitude, longitude);
        },
        () => {
            mostrarMensagem("SEM LOCALIZAÇÃO", "Não foi possível obter sua localização. Verifique a permissão do navegador.");
        }
    );
});
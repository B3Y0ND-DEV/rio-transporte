const mapa = L.map("mapa", { zoomControl: false, attributionControl: false }).setView([-22.9035, -43.2096], 13);
L.control.zoom({ position: "topright" }).addTo(mapa);
L.control.attribution({ position: "topleft" }).addTo(mapa);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:  "&copy; OpenStreetMap | Data.Rio (CC-BY)",
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

// NOVO: Variáveis para guardar o monitoramento contínuo e a marcação do GPS
let idMonitoramento = null;
let marcadorUsuario = null;
let ultimaBusca = null;

function mostrarMensagem(titulo, texto) {
    elNome.textContent = titulo;
    elInfo.textContent = texto;
    elLinhas.replaceChildren();
    document.getElementById("btn-parceiro")?.remove();
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

// SUBSTiTUÍDO: Agora usa watchPosition para acompanhar a geolocalização ao vivo
botaoLocal.addEventListener("click", () => {
    if (!navigator.geolocation) {
        mostrarMensagem("SEM LOCALIZAÇÃO", "Seu navegador não suporta localização.");
        return;
    }

    if (idMonitoramento !== null) {
        navigator.geolocation.clearWatch(idMonitoramento);
    }

    let primeiraPosicao = true;
    ultimaBusca = null;

    idMonitoramento = navigator.geolocation.watchPosition(
        (posicao) => {
            const { latitude, longitude } = posicao.coords;

            if (primeiraPosicao) {
                mapa.setView([latitude, longitude], 16);
                primeiraPosicao = false;
            }

            if (marcadorUsuario) {
                marcadorUsuario.setLatLng([latitude, longitude]);
            } else {
                marcadorUsuario = L.circleMarker([latitude, longitude], {
                    radius: 8, color: "#FFFFFF", weight: 2, fillColor: "#2D3BFF", fillOpacity: 1,
                }).addTo(mapa);
            }

            if (!ultimaBusca || mapa.distance(ultimaBusca, [latitude, longitude]) > 60) {
                ultimaBusca = [latitude, longitude];
                buscarParadas(latitude, longitude);
            }
        },
        () => {
            mostrarMensagem("SEM LOCALIZAÇÃO", "Não foi possível obter sua localização. Verifique as permissões do navegador.");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
});
// --- EXEMPLO: EVENTOS E PARCEIROS EM TEMPO REAL ---
const eventoParceiro = {
    id: "rock-in-rio",
    nome: "Rock in Rio 2026",
    categoria: "show",
    lat: -22.978,
    lon: -43.395,
    descricao: "Linhas especiais de ônibus e BRT disponíveis.",
    linhasProximas: ["352", "613", "BRT-EX"],
    linkOficial: "https://rockinrio.com"
};

const iconeEvento = L.divIcon({ className: "evento", iconSize: [22, 22] });

const marcadorEvento = L.marker([eventoParceiro.lat, eventoParceiro.lon], {
    icon: iconeEvento,
    title: eventoParceiro.nome,
}).addTo(mapa);

marcadorEvento.on("click", () => {
    pedidoAtual++;
    if (marcadorEscolhido) {
        marcadorEscolhido.setIcon(iconeNormal);
        marcadorEscolhido = null;
    }
    mostrarMensagem(eventoParceiro.nome, eventoParceiro.descricao);

    eventoParceiro.linhasProximas.forEach((linha) => {
        const item = document.createElement("li");
        item.textContent = linha;
        elLinhas.appendChild(item);
    });

    const btnLink = document.createElement("a");
    btnLink.id = "btn-parceiro";
    btnLink.className = "botao";
    btnLink.target = "_blank";
    btnLink.rel = "noopener noreferrer";
    btnLink.href = eventoParceiro.linkOficial;
    btnLink.textContent = "ACESSAR SITE DO EVENTO";
    document.querySelector(".cartao").appendChild(btnLink);
});
// --- LÓGICA DE NAVEGAÇÃO DAS ABAS ---
const botoesAba = document.querySelectorAll(".menu .aba");
const secaoInicio = document.getElementById("secao-inicio");
const secaoMelhorias = document.getElementById("secao-melhorias");

botoesAba.forEach(botao => {
    // Remove o 'disabled' da aba melhorias para que o usuário possa clicar
    if (botao.getAttribute("data-alvo") === "melhorias") {
        botao.removeAttribute("disabled");
        botao.removeAttribute("title");
    }

    botao.addEventListener("click", () => {
        const alvo = botao.getAttribute("data-alvo");
        if (!alvo || botao.hasAttribute("disabled")) return;

        // Alterna classe ativa nos botões
        botoesAba.forEach(b => b.classList.remove("ativa"));
        botao.classList.add("ativa");

        // Alterna a exibição das seções
        if (alvo === "inicio") {
            secaoInicio.classList.add("ativa");
            secaoMelhorias.classList.remove("ativa");
            secaoMelhorias.style.display = "none";
            // Invalida o tamanho do mapa caso estivesse oculto
            setTimeout(() => mapa.invalidateSize(), 100);
        } else if (alvo === "melhorias") {
            secaoInicio.classList.remove("ativa");
            secaoMelhorias.classList.add("ativa");
            secaoMelhorias.style.display = "flex";
        }
    });
});

// --- LÓGICA DO FORMULÁRIO DE MELHORIAS ---
const formMelhoria = document.getElementById("form-melhoria");
const textoMelhoria = document.getElementById("texto-melhoria");
const msgSucesso = document.getElementById("msg-sucesso");

if (formMelhoria) {
    formMelhoria.addEventListener("submit", (e) => {
        e.preventDefault();
        const sugestao = textoMelhoria.value.trim();
        
        if (sugestao.length < 5) return;

        // Aqui poderias enviar via fetch para o backend (Node.js/SQLite), por enquanto simulamos o sucesso local:
        msgSucesso.style.display = "block";
        textoMelhoria.value = "";

        setTimeout(() => {
            msgSucesso.style.display = "none";
        }, 4000);
    });
}
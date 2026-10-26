# Rio Transporte

Mapa de paradas e linhas de ônibus do Rio de Janeiro, sem anúncios.

## Por que fiz este projeto

Muitos apps de transporte têm anúncios em todo lugar, até no menu de configurações, e atrapalham quem só quer saber qual ônibus pegar. Quis fazer uma alternativa simples, rápida e que respeita quem usa.

## O que faz hoje

- Mostra no mapa as paradas num raio de 800 m do ponto clicado
- Mostra as linhas de ônibus que passam em cada parada

## Tecnologias

- Python: importa os dados para o banco
- SQLite: banco de dados
- Node.js + Express: API
- Leaflet + OpenStreetMap: mapa

## Como rodar

1. Baixe o GTFS do Rio no portal Data.Rio (https://www.data.rio, busque por "GTFS") e extraia em `dados/gtfs/gtfs/`
2. Rode `python scripts/importar_gtfs.py`
3. Rode `npm install`
4. Rode `node src/server.js` e abra http://localhost:3000

## Dados

Prefeitura da Cidade do Rio de Janeiro (Data.Rio), licença CC-BY. Mapa: colaboradores do OpenStreetMap.
import csv
import sqlite3
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
PASTA_GTFS = RAIZ / "dados" / "gtfs" / "gtfs"
ARQUIVO_SCHEMA = RAIZ / "sql" / "schema.sql"
ARQUIVO_BANCO = RAIZ / "dados" / "rio.db"


def criar_banco():
    if ARQUIVO_BANCO.exists():
        ARQUIVO_BANCO.unlink()
    conexao = sqlite3.connect(ARQUIVO_BANCO)
    conexao.executescript(ARQUIVO_SCHEMA.read_text(encoding="utf-8"))
    return conexao


def importar_stops(conexao):
    caminho = PASTA_GTFS / "stops.txt"

    with open(caminho, encoding="utf-8-sig", newline="") as arquivo:
        leitor = csv.DictReader(arquivo)
        linhas = [
            (parada["stop_id"], parada["stop_name"], float(parada["stop_lat"]), float(parada["stop_lon"]))
            for parada in leitor
        ]

    conexao.executemany(
        "INSERT INTO stops (stop_id, stop_name, stop_lat, stop_lon) VALUES (?, ?, ?, ?)",
        linhas,
    )
    conexao.commit()
    print(f"{len(linhas)} paradas importadas")


def importar_routes(conexao):
    caminho = PASTA_GTFS / "routes.txt"

    with open(caminho, encoding="utf-8-sig", newline="") as arquivo:
        leitor = csv.DictReader(arquivo)
        linhas = [
            (
                rota["route_id"],
                rota["agency_id"],
                rota["route_short_name"],
                rota["route_long_name"],
                int(rota["route_type"]),
                rota["route_color"],
            )
            for rota in leitor
        ]

    conexao.executemany(
        "INSERT INTO routes (route_id, agency_id, route_short_name, route_long_name, route_type, route_color) "
        "VALUES (?, ?, ?, ?, ?, ?)",
        linhas,
    )
    conexao.commit()
    print(f"{len(linhas)} linhas importadas")


def main():
    conexao = criar_banco()
    importar_stops(conexao)
    importar_routes(conexao)
    conexao.close()


if __name__ == "__main__":
    main()
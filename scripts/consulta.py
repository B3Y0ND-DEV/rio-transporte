import sqlite3
import time

conexao = sqlite3.connect("dados/rio.db")

PARADA = "1002O00010C0"

consulta = """
SELECT DISTINCT r.route_short_name, r.route_long_name
FROM stop_times st
JOIN trips t ON t.trip_id = st.trip_id
JOIN routes r ON r.route_id = t.route_id
WHERE st.stop_id = ?
ORDER BY r.route_short_name
"""

inicio = time.perf_counter()
resultado = conexao.execute(consulta, (PARADA,)).fetchall()
duracao = time.perf_counter() - inicio

for linha in resultado:
    print(linha)
print(f"consulta levou {duracao:.3f} segundos")    


#for linha in conexao.execute(consulta, (PARADA,)):
    #print(linha)

conexao.close()    
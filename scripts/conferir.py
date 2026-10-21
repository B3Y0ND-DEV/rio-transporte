import sqlite3

conexao = sqlite3.connect("dados/rio.db")

print("Paradas:", conexao.execute("SELECT COUNT(*) FROM stops").fetchone()[0])
print("Linhas:", conexao.execute("SELECT COUNT(*) FROM routes").fetchone()[0])
print("Viagens:", conexao.execute("SELECT COUNT(*) FROM trips").fetchone()[0])
print("Horários:", conexao.execute("SELECT COUNT(*) FROM stop_times").fetchone()[0])
print("Exemplos:")
for parada in conexao.execute("SELECT * FROM stops LIMIT 3"):
    print(" ", parada)


print("Exemplos de linhas:")
for rota in conexao.execute("SELECT route_short_name, route_long_name FROM routes LIMIT 3"):
    print(" ", rota)

orfas = conexao.execute("""
    SELECT COUNT(*) FROM stop_times
    WHERE stop_id NOT IN (SELECT stop_id FROM stops)
""").fetchone()[0]
print("Horários com parada inexistente:", orfas)
   
conexao.close()        
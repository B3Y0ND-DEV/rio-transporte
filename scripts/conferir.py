import sqlite3

conexao = sqlite3.connect("dados/rio.db")

print("Paradas:", conexao.execute("SELECT COUNT(*) FROM stops").fetchone()[0])
print("Linhas:", conexao.execute("SELECT COUNT(*) FROM routes").fetchone()[0])
print("Exemplos:")
for parada in conexao.execute("SELECT * FROM stops LIMIT 3"):
    print(" ", parada)


print("Exemplos de linhas:")
for rota in conexao.execute("SELECT route_short_name, route_long_name FROM routes LIMIT 3"):
    print(" ", rota)
   
conexao.close()        
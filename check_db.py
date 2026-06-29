import sqlite3
conn = sqlite3.connect("users.db")
tables = conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
print("Tables:", [t[0] for t in tables])
for t in tables:
    cols = conn.execute("PRAGMA table_info(%s)" % t[0]).fetchall()
    print(t[0], "columns:", [c[1] for c in cols])
conn.close()

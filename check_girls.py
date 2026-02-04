import psycopg2

try:
    conn = psycopg2.connect(
        host='localhost',
        port=5432,
        user='postgres',
        password='password',
        database='eva_db'
    )
    cursor = conn.cursor()

    cursor.execute("SELECT id, name, \"avatarUrl\" FROM girls WHERE \"avatarUrl\" IS NOT NULL AND \"avatarUrl\" != '' LIMIT 10")
    girls = cursor.fetchall()
    print('Girls with avatar URLs:')
    for girl in girls:
        print(f'ID: {girl[0]}, Name: {girl[1]}')
        print(f'  URL: {girl[2]}')
        print()

    conn.close()

except Exception as e:
    print(f"Error: {e}")
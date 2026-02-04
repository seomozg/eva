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

    cursor.execute("SELECT id, name, \"avatarUrl\" FROM girls WHERE \"avatarUrl\" LIKE '/uploads/%'")
    local_urls = cursor.fetchall()
    print(f'Girls with local URLs: {len(local_urls)}')
    for girl in local_urls:
        print(f'  {girl[0]}: {girl[1]} -> {girl[2]}')

    conn.close()

except Exception as e:
    print(f"Error: {e}")
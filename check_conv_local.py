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

    cursor.execute("SELECT id, \"mediaUrl\" FROM conversations WHERE \"mediaUrl\" LIKE '/uploads/%'")
    local_urls = cursor.fetchall()
    print(f'Conversations with local URLs: {len(local_urls)}')
    for conv in local_urls:
        print(f'  {conv[0]} -> {conv[1]}')

    conn.close()

except Exception as e:
    print(f"Error: {e}")
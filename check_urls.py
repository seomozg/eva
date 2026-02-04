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

    # Check girls avatar URLs
    cursor.execute('SELECT "avatarUrl" FROM girls LIMIT 5')
    girls = cursor.fetchall()
    print('Girls avatar URLs:')
    for girl in girls:
        print(f'  {girl[0]}')

    # Check conversations media URLs
    cursor.execute('SELECT "mediaUrl" FROM conversations LIMIT 5')
    convs = cursor.fetchall()
    print('\nConversations media URLs:')
    for conv in convs:
        print(f'  {conv[0]}')

    conn.close()

except Exception as e:
    print(f"Error: {e}")
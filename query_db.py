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

    print('=== USERS ===')
    cursor.execute('SELECT id, email, "firstName", "lastName", balance, "subscriptionType", "isActive", "createdAt" FROM users')
    users = cursor.fetchall()
    for user in users:
        print(f'ID: {user[0]}, Email: {user[1]}, Name: {user[2]} {user[3]}, Balance: {user[4]}, Subscription: {user[5]}, Active: {user[6]}')

    print('\n=== GIRLS ===')
    cursor.execute('SELECT id, "userId", name, appearance, personality, "avatarUrl", "isActive", "createdAt" FROM girls')
    girls = cursor.fetchall()
    for girl in girls:
        print(f'ID: {girl[0]}, UserID: {girl[1]}, Name: {girl[2]}, Avatar: {girl[5]}, Active: {girl[6]}')
        appearance = str(girl[3]) if girl[3] else ""
        personality = str(girl[4]) if girl[4] else ""
        print(f'  Appearance: {appearance[:100]}...' if len(appearance) > 100 else f'  Appearance: {appearance}')
        print(f'  Personality: {personality[:100]}...' if len(personality) > 100 else f'  Personality: {personality}')
        print()

    print('=== CONVERSATIONS (Last 10) ===')
    cursor.execute('SELECT id, "userId", "girlId", role, content, "mediaUrl", "mediaType", "createdAt" FROM conversations ORDER BY "createdAt" DESC LIMIT 10')
    convs = cursor.fetchall()
    for conv in convs:
        content = str(conv[4]) if conv[4] else ""
        content_preview = content[:100] + '...' if len(content) > 100 else content
        print(f'ID: {conv[0]}, User: {conv[1]}, Girl: {conv[2]}, Role: {conv[3]}')
        print(f'  Content: {content_preview}')
        print(f'  Media: {conv[5]}, Type: {conv[6]}')
        print()

    print('=== TRANSACTIONS (Last 10) ===')
    cursor.execute('SELECT id, "userId", type, amount, description, "createdAt" FROM transactions ORDER BY "createdAt" DESC LIMIT 10')
    trans = cursor.fetchall()
    for tran in trans:
        print(f'ID: {tran[0]}, User: {tran[1]}, Type: {tran[2]}, Amount: {tran[3]}, Desc: {tran[4]}')

    cursor.close()
    conn.close()

except Exception as e:
    print(f'Error: {e}')
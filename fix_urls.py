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

    base_url = 'http://localhost:3000'  # Change to 'https://eva.test-domain.ru' for production

    # Update girls avatar URLs
    cursor.execute("UPDATE girls SET \"avatarUrl\" = %s || \"avatarUrl\" WHERE \"avatarUrl\" LIKE %s", (base_url, '/uploads/%'))
    print("Updated girls avatar URLs")

    # Update conversations media URLs
    cursor.execute("UPDATE conversations SET \"mediaUrl\" = %s || \"mediaUrl\" WHERE \"mediaUrl\" LIKE %s", (base_url, '/uploads/%'))
    print("Updated conversations media URLs")

    conn.commit()

    # Check results
    cursor.execute("SELECT COUNT(*) FROM girls WHERE \"avatarUrl\" LIKE 'http%'")
    girls_count = cursor.fetchone()[0]
    print(f"Girls with HTTP URLs: {girls_count}")

    cursor.execute("SELECT COUNT(*) FROM conversations WHERE \"mediaUrl\" LIKE 'http%'")
    conv_count = cursor.fetchone()[0]
    print(f"Conversations with HTTP URLs: {conv_count}")

    conn.close()
    print("Database URLs updated successfully!")

except Exception as e:
    print(f"Error: {e}")
const { Client } = require('pg');

async function queryDatabase() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'password',
    database: 'eva_db'
  });

  try {
    await client.connect();
    console.log('Connected to database\n');

    // Query users
    console.log('=== USERS ===');
    const usersResult = await client.query('SELECT id, email, "firstName", "lastName", balance, "subscriptionType", "isActive", "createdAt" FROM users');
    console.table(usersResult.rows);

    // Query girls
    console.log('\n=== GIRLS ===');
    const girlsResult = await client.query('SELECT id, "userId", name, appearance, personality, "avatarUrl", "isActive", "createdAt" FROM girls');
    console.table(girlsResult.rows);

    // Query conversations (last 5)
    console.log('\n=== CONVERSATIONS (last 5) ===');
    const convResult = await client.query('SELECT id, "userId", "girlId", role, content, "mediaUrl", "mediaType", "createdAt" FROM conversations ORDER BY "createdAt" DESC LIMIT 5');
    console.table(convResult.rows);

    // Query transactions (last 5)
    console.log('\n=== TRANSACTIONS (last 5) ===');
    const transResult = await client.query('SELECT id, "userId", type, amount, description, "createdAt" FROM transactions ORDER BY "createdAt" DESC LIMIT 5');
    console.table(transResult.rows);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

queryDatabase();
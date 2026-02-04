const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'password',
  database: 'eva_db'
});

async function queryDB() {
  try {
    await client.connect();

    console.log('=== USERS ===');
    const users = await client.query('SELECT id, email, "firstName", "lastName", balance, "subscriptionType", "isActive" FROM users');
    users.rows.forEach(row => console.log(JSON.stringify(row, null, 2)));

    console.log('\n=== GIRLS ===');
    const girls = await client.query('SELECT id, "userId", name, "avatarUrl", "isActive" FROM girls');
    girls.rows.forEach(row => console.log(JSON.stringify(row, null, 2)));

    console.log('\n=== RECENT CONVERSATIONS ===');
    const convs = await client.query('SELECT id, "userId", "girlId", role, LEFT(content, 100) as content_preview, "mediaUrl", "mediaType" FROM conversations ORDER BY "createdAt" DESC LIMIT 3');
    convs.rows.forEach(row => console.log(JSON.stringify(row, null, 2)));

    console.log('\n=== RECENT TRANSACTIONS ===');
    const trans = await client.query('SELECT id, "userId", type, amount, description FROM transactions ORDER BY "createdAt" DESC LIMIT 3');
    trans.rows.forEach(row => console.log(JSON.stringify(row, null, 2)));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

queryDB();
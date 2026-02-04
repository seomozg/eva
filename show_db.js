const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'password',
  database: 'eva_db'
});

async function showDatabase() {
  try {
    await client.connect();
    console.log('Connected to database\n');

    // Show users
    console.log('=== USERS ===');
    const users = await client.query('SELECT * FROM users');
    console.table(users.rows);

    // Show girls
    console.log('\n=== GIRLS ===');
    const girls = await client.query('SELECT * FROM girls');
    console.table(girls.rows);

    // Show conversations
    console.log('\n=== CONVERSATIONS ===');
    const conversations = await client.query('SELECT * FROM conversations ORDER BY "createdAt" DESC LIMIT 10');
    console.table(conversations.rows);

    // Show transactions
    console.log('\n=== TRANSACTIONS ===');
    const transactions = await client.query('SELECT * FROM transactions ORDER BY "createdAt" DESC LIMIT 10');
    console.table(transactions.rows);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

showDatabase();
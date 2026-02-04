const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'password',
  database: 'eva_db'
});

async function updateUrls() {
  try {
    await client.connect();

    // Update girls avatar URLs
    const baseUrl = 'http://localhost:3000'; // Change to 'https://eva.test-domain.ru' for production
    await client.query(`
      UPDATE girls
      SET "avatarUrl" = CONCAT($1, "avatarUrl")
      WHERE "avatarUrl" LIKE '/uploads/%'
    `, [baseUrl]);

    console.log('Updated girls avatar URLs');

    // Update conversations media URLs
    await client.query(`
      UPDATE conversations
      SET "mediaUrl" = CONCAT($1, "mediaUrl")
      WHERE "mediaUrl" LIKE '/uploads/%'
    `, [baseUrl]);

    console.log('Updated conversations media URLs');

    // Check results
    const girlsResult = await client.query('SELECT COUNT(*) as count FROM girls WHERE "avatarUrl" LIKE \'http%\'');
    console.log(`Girls with HTTP URLs: ${girlsResult.rows[0].count}`);

    const convResult = await client.query('SELECT COUNT(*) as count FROM conversations WHERE "mediaUrl" LIKE \'http%\'');
    console.log(`Conversations with HTTP URLs: ${convResult.rows[0].count}`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

updateUrls();
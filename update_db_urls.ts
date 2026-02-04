import { createConnection } from 'typeorm';
import { Girl } from './backend/src/entities/girl.entity';
import { Conversation } from './backend/src/entities/conversation.entity';

async function updateUrls() {
  const connection = await createConnection({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'password',
    database: 'eva_db',
    entities: [Girl, Conversation],
    synchronize: false,
  });

  try {
    const baseUrl = 'http://localhost:3000'; // Change to 'https://eva.test-domain.ru' for production

    // Update girls avatar URLs
    const girlsUpdated = await connection
      .createQueryBuilder()
      .update(Girl)
      .set({ avatarUrl: () => `CONCAT('${baseUrl}', "avatarUrl")` })
      .where('"avatarUrl" LIKE :pattern', { pattern: '/uploads/%' })
      .execute();

    console.log(`Updated ${girlsUpdated.affected} girls avatar URLs`);

    // Update conversations media URLs
    const convsUpdated = await connection
      .createQueryBuilder()
      .update(Conversation)
      .set({ mediaUrl: () => `CONCAT('${baseUrl}', "mediaUrl")` })
      .where('"mediaUrl" LIKE :pattern', { pattern: '/uploads/%' })
      .execute();

    console.log(`Updated ${convsUpdated.affected} conversations media URLs`);

    // Check results
    const girlsWithHttp = await connection
      .getRepository(Girl)
      .createQueryBuilder('girl')
      .where('girl.avatarUrl LIKE :pattern', { pattern: 'http%' })
      .getCount();

    console.log(`Girls with HTTP URLs: ${girlsWithHttp}`);

    const convsWithHttp = await connection
      .getRepository(Conversation)
      .createQueryBuilder('conv')
      .where('conv.mediaUrl LIKE :pattern', { pattern: 'http%' })
      .getCount();

    console.log(`Conversations with HTTP URLs: ${convsWithHttp}`);

  } catch (error) {
    console.error('Error updating URLs:', error);
  } finally {
    await connection.close();
  }
}

updateUrls().catch(console.error);
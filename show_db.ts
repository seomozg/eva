import { DataSource } from 'typeorm';
import { User } from './backend/src/entities/user.entity';
import { Girl } from './backend/src/entities/girl.entity';
import { Conversation } from './backend/src/entities/conversation.entity';
import { Transaction } from './backend/src/entities/transaction.entity';

const dataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'password',
  database: 'eva_db',
  entities: [User, Girl, Conversation, Transaction],
  synchronize: false,
});

async function showData() {
  try {
    await dataSource.initialize();
    console.log('Connected to database\n');

    console.log('=== USERS ===');
    const users = await dataSource.getRepository(User).find();
    console.table(users);

    console.log('\n=== GIRLS ===');
    const girls = await dataSource.getRepository(Girl).find();
    console.table(girls);

    console.log('\n=== CONVERSATIONS (last 10) ===');
    const conversations = await dataSource.getRepository(Conversation).find({
      order: { createdAt: 'DESC' },
      take: 10
    });
    console.table(conversations);

    console.log('\n=== TRANSACTIONS (last 10) ===');
    const transactions = await dataSource.getRepository(Transaction).find({
      order: { createdAt: 'DESC' },
      take: 10
    });
    console.table(transactions);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await dataSource.destroy();
  }
}

showData();
import { SleepEntry } from 'src/sleep/sleep.entity';
import { User } from 'src/users/users.entity';
import { DataSource } from 'typeorm';

export const databaseProviders = [
  {
    provide: 'DATA_SOURCE',
    useFactory: async () => {
      const dataSource = new DataSource({
        type: 'sqlite',
        database: 'db.sqlite',
        entities: [User, SleepEntry],
      });

      return dataSource.initialize();
    },
  },
];

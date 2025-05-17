import { Module } from '@nestjs/common';
import { SleepController } from './sleep.controller';
import { SleepService } from './sleep.service';
import { DatabaseModule } from '../database/database.module';
import { DataSource } from 'typeorm';
import { SleepEntry } from './sleep.entity';
import { AuthModule } from '../auth/auth.module';

export const sleepProviders = [
  {
    provide: 'SLEEP_ENTRY_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(SleepEntry),
    inject: ['DATA_SOURCE'],
  },
];

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [SleepController],
  providers: [...sleepProviders, SleepService],
})
export class SleepModule {}

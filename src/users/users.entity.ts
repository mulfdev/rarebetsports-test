import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { SleepEntry } from '../sleep/sleep.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  userId: number;

  @Column({ length: 255 })
  username: string;

  @Column({ length: 255 })
  password: string;

  @OneToMany(() => SleepEntry, (sleepEntry) => sleepEntry.user)
  sleepEntries: SleepEntry[];
}

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/users.entity';

@Entity('sleep_entries')
export class SleepEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  dateOfSleep: string;
  @Column({ type: 'datetime' })
  sleepTime: Date;
  @Column({ type: 'datetime' })
  wakeUpTime: Date;
  @Column()
  durationInMinutes: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  userId: number;

  @ManyToOne(() => User, (user) => user.sleepEntries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}

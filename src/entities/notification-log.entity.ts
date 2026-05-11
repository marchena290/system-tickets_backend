import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
}

@Entity('notifications_log')
export class NotificationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'ticket_id' })
  ticketId: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ name: 'to_email' })
  toEmail: string;

  @Column()
  subject: string;

  @Column('text')
  body: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  @Column('text', { nullable: true })
  error: string;

  @Column({ default: 0 })
  attempts: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt: Date;

  @Column('text', { nullable: true })
  payload: string;
}

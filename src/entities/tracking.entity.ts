import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Tickets } from './ticket.entity';

@Entity('seguimientos')
export class Tracking {
  // Definición de columnas y relaciones aquí
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  description: string;

  @ManyToOne(() => Tickets, (ticket) => ticket.trackings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ticketId' })
  ticket: Tickets;

  @Column({ name: 'ticketId' })
  ticketId: number;

  @ManyToOne(() => User, (user) => user.tracking, { eager: true })
  usuario: User;

  @Column()
  UsuarioId: number;

  @Column({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fecha_registro: Date;
}

import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Tracking } from './tracking.entity';

export enum TicketType {
  REDES = 'REDES',
  SOFTWARE = 'SOFTWARE',
  HARDWARE = 'HARDWARE',
}

export enum TicketStatus {
  ABIERTO = 'ABIERTO',
  EN_REVISION = 'EN_REVISION',
  EN_PROGRESO = 'EN_PROGRESO',
  FINALIZADO = 'FINALIZADO',
}

export enum TicketCategory {
  BAJA = 'BAJA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
}

@Entity('tickets')
export class Tickets {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: TicketType })
  type: TicketType;

  @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.ABIERTO })
  status: TicketStatus;

  @Column({ type: 'enum', enum: TicketCategory, nullable: true })
  category: TicketCategory;

  @Column({
    type: 'timestamp without time zone',
    nullable: true,
    name: 'deadline_at',
  })
  deadlineAt: Date | null;

  @Column({ nullable: true })
  evidenciaUrl: string;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'ultima_actualizacion', nullable: true })
  ultimaActualizacion: Date | null;

  @ManyToOne(() => User, (user) => user.createTickets)
  @JoinColumn({ name: 'creator_id' })
  user: User;

  @ManyToOne(() => User, (user) => user.ticketsAsignados, { nullable: true })
  @JoinColumn({ name: 'assigned_id' })
  assignedTo: User | null;

  @OneToMany(() => Tracking, (tracking) => tracking.ticket)
  trackings: Tracking[];

  @Column({ type: 'varchar', nullable: true, name: 'requester_email' })
  requesterEmail: string;

  @Column({ type: 'varchar', nullable: true, name: 'requester_name' })
  requesterName: string;
}

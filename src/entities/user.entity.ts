import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Tracking } from './tracking.entity';
import { Rol } from './rol.entity';
import { Tickets } from './ticket.entity';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  nombreCompleto: string;

  @Column()
  cedula: string;

  @Column()
  departamento: string;

  @Column()
  contacto: string;

  @Column({ select: false })
  password: string;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Rol)
  @JoinColumn({ name: 'rol_Id' })
  rol: Rol;

  @OneToMany(() => Tickets, (ticket) => ticket.assignedTo)
  tickets: Tickets[];

  @OneToMany(() => Tracking, (tracking) => tracking.usuario)
  tracking: Tracking[];

  @OneToMany(() => Tickets, (ticket) => ticket.user)
  createTickets: Tickets[];
}

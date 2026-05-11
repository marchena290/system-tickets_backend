import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

export enum UserRol {
  COLABORADOR = 'COLABORADOR',
  SOPORTISTA = 'SOPORTISTA',
  SUPERVISOR = 'SUPERVISOR',
  CLIENTE = 'CLIENTE',
}

@Entity('rol')
export class Rol {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: UserRol;

  @OneToMany(() => User, (user) => user.rol)
  users: User[];
}

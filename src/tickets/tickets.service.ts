import { Injectable } from '@nestjs/common';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tickets, TicketStatus } from 'src/entities/ticket.entity';
import { User } from 'src/entities/user.entity';
import { UserRol } from 'src/entities/rol.entity';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Tickets)
    private readonly ticketsRepository: Repository<Tickets>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createTicketDto: CreateTicketDto, user: User): Promise<Tickets> {
    const newTicket = this.ticketsRepository.create({
      title: createTicketDto.asunto,
      description: createTicketDto.descripcion,
      type: createTicketDto.tipo,
      category: createTicketDto.categoria,
      status: TicketStatus.ABIERTO,
      user: user,
    });

    return await this.ticketsRepository.save(newTicket);
  }

  async findAll(user: User): Promise<Tickets[]> {
    // Si es Supervisor, devuelve todos los tickets
    if (user.rol.name === UserRol.SUPERVISOR) {
      return await this.ticketsRepository.find({
        relations: ['user', 'assignedTo'],
      });
    }

    // Si es Soportista, devuelve los tickets asignados a él
    if (user.rol.name === UserRol.SOPORTISTA) {
      return await this.ticketsRepository.find({
        where: { assignedTo: { id: user.id } },
        relations: ['user', 'assignedTo'],
      });
    }

    // Si es Colaborador, devuelve los tickets creados por él
    return await this.ticketsRepository.find({
      where: { user: { id: user.id } },
      relations: ['user', 'assignedTo'],
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} ticket`;
  }

  update(id: number, updateTicketDto: UpdateTicketDto) {
    return `This action updates a #${id} ticket`;
  }

  remove(id: number) {
    return `This action removes a #${id} ticket`;
  }
}

import { Injectable } from '@nestjs/common';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tickets, TicketStatus } from 'src/entities/ticket.entity';
import { User } from 'src/entities/user.entity';

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

  findAll() {
    return `This action returns all tickets`;
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

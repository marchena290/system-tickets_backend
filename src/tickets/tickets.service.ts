import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

  async findOne(id: number, user: User): Promise<Tickets> {
    // 1. Buscar el ticket por ID con sus relaciones
    const ticket = await this.ticketsRepository.findOne({
      where: { id },
      relations: ['user', 'assignedTo'],
    });

    // 2. Verificar si el ticket existe
    if (!ticket) {
      throw new NotFoundException(`Ticket con ID ${id} no encontrado`);
    }

    // 3. SUPERVISOR puede ver cualquier ticket
    if (user.rol.name === UserRol.SUPERVISOR) {
      return ticket;
    }

    // 4. SOPORTISTA puede ver tickets asignados a él
    if (user.rol.name === UserRol.SOPORTISTA) {
      if (ticket.assignedTo && ticket.assignedTo.id === user.id) {
        return ticket;
      }
      throw new ForbiddenException('No tienes permiso para ver este ticket');
    }

    // 5. COLABORADOR puede ver tickets que él creó
    if (user.rol.name === UserRol.COLABORADOR) {
      if (ticket.user.id === user.id) {
        return ticket;
      }
    }

    throw new ForbiddenException('No tienes permiso para ver este ticket');
  }

  async update(
    id: number,
    updateTicketDto: UpdateTicketDto,
    user: User,
  ): Promise<Tickets> {
    // 1. Buscar ticket (validar que existe y permisos básicos)
    const ticket = await this.findOne(id, user);

    // 2. validar qué pueda actualizar segun el rol
    if (user.rol.name === UserRol.SUPERVISOR) {
      // El SUPERVISOR puede actualizar cualquier campo
      if (updateTicketDto.asunto) ticket.title = updateTicketDto.asunto;
      if (updateTicketDto.descripcion)
        ticket.description = updateTicketDto.descripcion;
      if (updateTicketDto.tipo) ticket.type = updateTicketDto.tipo;
      if (updateTicketDto.categoria)
        ticket.category = updateTicketDto.categoria;

      // 3. SOPORTISTA puede editar descripción de tickets asignados a él
    } else if (user.rol.name === UserRol.SOPORTISTA) {
      if (updateTicketDto.descripcion)
        ticket.description = updateTicketDto.descripcion;

      // 4. COLABORADOR puede editar solo asunto y descripción de SUS tickets
    } else if (user.rol.name === UserRol.COLABORADOR) {
      if (updateTicketDto.asunto) ticket.title = updateTicketDto.asunto;
      if (updateTicketDto.descripcion)
        ticket.description = updateTicketDto.descripcion;
    }

    return await this.ticketsRepository.save(ticket);
  }

  async remove(id: number, user: User): Promise<{ message: string }> {
    const ticket = await this.findOne(id, user);

    if (user.rol.name !== UserRol.SUPERVISOR) {
      throw new ForbiddenException(
        'No tienes permiso para eliminar este ticket',
      );
    }

    await this.ticketsRepository.remove(ticket);

    return { message: `Ticket con ID ${id} eliminado exitosamente` };
  }
}

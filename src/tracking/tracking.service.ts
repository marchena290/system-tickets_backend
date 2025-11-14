import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTrackingDto } from './dto/create-tracking.dto';
import { User } from 'src/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Tracking } from 'src/entities/tracking.entity';
import { Repository } from 'typeorm';
import { Tickets } from 'src/entities/ticket.entity';
import { UserRol } from 'src/entities/rol.entity';

@Injectable()
export class TrackingService {
  constructor(
    @InjectRepository(Tracking)
    private readonly trackingRepository: Repository<Tracking>,

    @InjectRepository(Tickets)
    private readonly ticketsRepository: Repository<Tickets>,
  ) {}

  async create(
    createTrackingDto: CreateTrackingDto,
    user: User,
  ): Promise<Tracking> {
    // Buscar el ticket asociado
    const ticket = await this.ticketsRepository.findOne({
      where: { id: createTrackingDto.ticketId },
      relations: ['user', 'assignedTo'],
    });

    if (!ticket) {
      throw new NotFoundException(
        `Ticket con ID ${createTrackingDto.ticketId} no encontrado`,
      );
    }

    const newTracking = this.trackingRepository.create({
      description: createTrackingDto.descripcion,
      ticket: ticket,
      usuario: user,
      TicketId: ticket.id,
      UsuarioId: user.id,
    });

    return await this.trackingRepository.save(newTracking);
  }

  async findAll(ticketId: number, user: User): Promise<Tracking[]> {
    // 1. Buscar el ticket y validar que existe
    const ticket = await this.ticketsRepository.findOne({
      where: { id: ticketId },
      relations: ['user', 'assignedTo'],
    });

    if (!ticket) {
      throw new NotFoundException(
        `El Ticket con ID ${ticketId} no fue encontrado`,
      );
    }

    // 2. Verificar permisos según el rol del usuario
    if (user.rol.name === UserRol.SUPERVISOR) {
      return await this.trackingRepository.find({
        order: { fecha_registro: 'DESC' },
        where: { TicketId: ticketId },
        relations: ['ticket', 'usuario'],
      });
    }

    if (user.rol.name === UserRol.SOPORTISTA) {
      // Validar que el ticket esté asignado a él
      if (!ticket.assignedTo || ticket.assignedTo.id !== user.id) {
        throw new NotFoundException(
          'No tienes permisos para ver estos seguimientos',
        );
      }

      // Retorna los trackings
      return await this.trackingRepository.find({
        order: { fecha_registro: 'DESC' },
        where: { TicketId: ticketId },
        relations: ['ticket', 'usuario'],
      });
    }

    if (user.rol.name === UserRol.COLABORADOR) {
      // Validar que el ticket lo creo el
      if (ticket.user.id !== user.id) {
        throw new NotFoundException(
          'No tienes permisos para ver estos seguimientos',
        );
      }

      // Retorna los trackings
      return await this.trackingRepository.find({
        order: { fecha_registro: 'DESC' },
        where: { TicketId: ticketId },
        relations: ['ticket', 'usuario'],
      });
    }

    throw new NotFoundException('Rol de usuario no válido');
  }
}

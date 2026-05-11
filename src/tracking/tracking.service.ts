import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTrackingDto } from './dto/create-tracking.dto';
import { User } from 'src/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Tracking } from 'src/entities/tracking.entity';
import { Repository } from 'typeorm';
import { Tickets } from 'src/entities/ticket.entity';
import { UserRol } from 'src/entities/rol.entity';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class TrackingService {
  constructor(
    @InjectRepository(Tracking)
    private readonly trackingRepository: Repository<Tracking>,

    @InjectRepository(Tickets)
    private readonly ticketsRepository: Repository<Tickets>,

    // 🎯 INYECCIÓN DEL EMAILSERVICE
    private readonly emailService: EmailService,
  ) {}

  async create(
    createTrackingDto: CreateTrackingDto,
    user: User,
  ): Promise<Tracking> {
    // 1. Buscar el ticket asociado
    const ticket = await this.ticketsRepository.findOne({
      where: { id: createTrackingDto.ticketId },
      relations: ['user', 'assignedTo'],
    });

    if (!ticket) {
      throw new NotFoundException(
        `Ticket con ID ${createTrackingDto.ticketId} no encontrado`,
      );
    }

    // ----------------------------------------------------
    // 2. LÓGICA DE ENVÍO DE CORREO A MAILTRAP (USANDO TU EMAILSERVICE)
    // ----------------------------------------------------

    // Obtener el correo del usuario que creó el ticket
    const destinatarioEmail = ticket.user?.email;

    if (destinatarioEmail) {
      try {
        // Llamar a tu método de envío de notificación de seguimiento
        await this.emailService.enviarNotificacionSeguimiento(
          destinatarioEmail,
          ticket.id,
          createTrackingDto.description,
        );
      } catch (error: unknown) {
        // Si hay un error, lo registramos pero permitimos que el seguimiento se guarde
        const message =
          error instanceof Error
            ? error.message
            : 'Error desconocido al enviar correo';
        console.error('Error al intentar notificar seguimiento:', message);
      }
    }

    // 3. Crear el nuevo seguimiento
    const newTracking = this.trackingRepository.create({
      description: createTrackingDto.description,
      ticket: ticket,
      usuario: user,
      TicketId: ticket.id,
      UsuarioId: user.id,
    });

    // 4. Guardar el seguimiento en la DB
    return await this.trackingRepository.save(newTracking);
  }

  // --- Método findAll (sin cambios funcionales, solo se incluye para completitud) ---
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

    if (
      user.rol.name === UserRol.COLABORADOR ||
      user.rol.name === UserRol.CLIENTE
    ) {
      // Validar que el ticket lo creó él
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

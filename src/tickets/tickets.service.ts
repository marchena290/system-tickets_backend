import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import {
  Tickets,
  TicketStatus,
  TicketCategory,
  TicketType,
} from 'src/entities/ticket.entity';
import { User } from 'src/entities/user.entity';
import { UserRol } from 'src/entities/rol.entity';
import { EmailService } from 'src/email/email.service';
import { Tracking } from 'src/entities/tracking.entity';
import { CreateTrackingDto as CreateTrackingDtoTicket } from './dto/create-tracking.dto';
import { UsersService } from 'src/users/users.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(
    @InjectRepository(Tickets)
    private readonly ticketsRepository: Repository<Tickets>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Tracking)
    private readonly trackingRepository: Repository<Tracking>,

    private readonly emailService: EmailService,

    private readonly usersService: UsersService,
  ) {}

  private calculateDeadline(category: TicketCategory | null): Date | null {
    if (!category) return null;
    const now = new Date();
    let hours = 48;
    switch (category) {
      case TicketCategory.ALTA:
        hours = 6;
        break;
      case TicketCategory.MEDIA:
        hours = 24;
        break;
      case TicketCategory.BAJA:
      default:
        hours = 48;
        break;
    }
    return new Date(now.getTime() + hours * 60 * 60 * 1000);
  }

  private resolveCategory(v: unknown): TicketCategory | null {
    if (!v) return null;
    if (Object.values(TicketCategory).includes(v as TicketCategory)) {
      return v as TicketCategory;
    }
    if (typeof v === 'string') {
      const s = v.toUpperCase();
      const found = (Object.values(TicketCategory) as string[]).find(
        (x) => x === s,
      );
      return (found as TicketCategory) ?? null;
    }
    return null;
  }

  async addTracking(
    ticketId: number,
    dto: CreateTrackingDtoTicket,
    user: User,
  ): Promise<Tracking> {
    const ticket = await this.ticketsRepository.findOne({
      where: { id: ticketId },
      relations: ['user', 'assignedTo'],
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket con ID ${ticketId} no encontrado`);
    }

    const newTracking = this.trackingRepository.create({
      description: dto.comment,
      ticket: ticket,
      TicketId: ticket.id,
      usuario: user,
      UsuarioId: user.id,
    });

    const saved: Tracking = await this.trackingRepository.save(newTracking);

    if (dto.newStatus) {
      ticket.status = dto.newStatus as unknown as TicketStatus;
      await this.ticketsRepository.save(ticket);
    } // ✅ NOTIFICACIÓN DE SEGUIMIENTO: Prioriza el requesterEmail guardado

    const destinatario = ticket.requesterEmail ?? ticket.user?.email ?? null;

    if (destinatario) {
      try {
        await this.emailService.enviarNotificacionSeguimiento(
          destinatario,
          ticket.id,
          dto.comment,
        );
      } catch (err) {
        this.logger.warn('No se pudo enviar notificación de seguimiento', err);
      }
    }

    return saved;
  } // -----------------------------------------------------------------
  // ✅ MÉTODO CREATE
  // -----------------------------------------------------------------
  async create(createTicketDto: CreateTicketDto, user: User): Promise<Tickets> {
    // 💡 Paso 1: Extraer el objeto requester
    const requesterData = createTicketDto.requester;
    let solicitante: User | null = null; // Eliminamos 'finalUser' para simplificar y usar siempre 'user' como creador del ticket.
    // 2. Lógica de Auto-Registro (si existe el objeto requester)
    if (requesterData) {
      // Creamos el objeto DTO que usersService.createClientUser espera.
      const clientUserData: CreateUserDto = {
        email: requesterData.email,
        nombreCompleto: requesterData.name,
        cedula: requesterData.cedula,
        departamento: requesterData.department,
        contacto: 'N/A',
        password: randomBytes(12).toString('hex'),
        rol: UserRol.CLIENTE,
      }; // Creamos/Recuperamos al cliente externo (Ricardo)

      solicitante = await this.usersService.createClientUser(clientUserData);
    }

    const title = createTicketDto.title;
    const resolvedCategory = this.resolveCategory(createTicketDto.category); // Determinar el email y nombre del solicitante real para notificaciones y filtros:
    // Si hay 'solicitante' (cliente externo), usamos sus datos. Si no, usamos los del 'user' logueado (Juan).
    const destinatarioEmail = solicitante?.email ?? user.email;
    const destinatarioName = solicitante?.nombreCompleto ?? user.nombreCompleto; // El usuario logueado (Juan) siempre es el que crea el registro de ticket.
    const userForTicket = user;

    const payload: Partial<Tickets> = {
      title: title,
      description: createTicketDto.description,
      type: createTicketDto.type,
      status: TicketStatus.ABIERTO, // ✅ El campo 'user' del ticket es siempre el usuario logueado.

      user: userForTicket, // ✅ Guardamos los datos del Solicitante

      requesterEmail: destinatarioEmail,
      requesterName: destinatarioName,
    };

    if (resolvedCategory) {
      payload.category = resolvedCategory;
      payload.deadlineAt = this.calculateDeadline(resolvedCategory);
    } // Comprobación de existencia y longitud de evidencia

    if (
      createTicketDto.evidenceUrls &&
      createTicketDto.evidenceUrls.length > 0
    ) {
      payload.evidenciaUrl = JSON.stringify(createTicketDto.evidenceUrls);
    }

    const newTicket = this.ticketsRepository.create(payload);
    const ticketGuardado = await this.ticketsRepository.save(newTicket); // ✅ NOTIFICACIÓN DE CREACIÓN

    if (destinatarioEmail && ticketGuardado?.id) {
      try {
        await this.emailService.enviarConfirmacionCreacionTicket(
          destinatarioEmail,
          ticketGuardado.id,
          ticketGuardado.title,
          userForTicket.id,
        );
      } catch (err) {
        this.logger.warn(
          `Error al enviar correo de creación para el Ticket #${ticketGuardado.id}:`,
          err,
        );
      }
    }

    return ticketGuardado;
  }
  // -----------------------------------------------------------------
  // ✅ MÉTODO FINDALL
  // -----------------------------------------------------------------
  async findAll(user: User): Promise<Tickets[]> {
    // 1. FILTRO PARA CLIENTES
    if (user.rol.name === UserRol.CLIENTE) {
      return await this.ticketsRepository.find({
        where: { requesterEmail: user.email },
        relations: ['user', 'assignedTo'],
        order: { id: 'DESC' },
      });
    }

    // 2. FILTRO PARA SUPERVISOR
    if (user.rol.name === UserRol.SUPERVISOR) {
      return await this.ticketsRepository.find({
        // 🚀 CORRECCIÓN: ELIMINAR EL FILTRO 'where: notFinalizado'
        relations: ['user', 'assignedTo'],
        order: { id: 'DESC' },
      });
    }

    // 3. FILTRO PARA SOPORTISTA
    if (user.rol.name === UserRol.SOPORTISTA) {
      // Mostrar todos los tickets para SOPORTISTA (no filtrar por estado)
      return await this.ticketsRepository.find({
        relations: ['user', 'assignedTo'],
        order: { id: 'DESC' },
      });
    }

    // 4. FILTRO PARA COLABORADOR
    return await this.ticketsRepository.find({
      where: {
        user: { id: user.id },
      },
      relations: ['user', 'assignedTo'],
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number, user: User): Promise<Tickets> {
    const ticket = await this.ticketsRepository.findOne({
      where: { id },
      relations: ['user', 'assignedTo'],
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket con ID ${id} no encontrado`);
    }

    // Casteamos de forma segura para evitar advertencias de ESLint
    const userRolName = user?.rol?.name as UserRol | undefined;

    // 1. SUPERVISOR Y SOPORTISTA: Acceso total de lectura
    if (
      userRolName === UserRol.SUPERVISOR ||
      userRolName === UserRol.SOPORTISTA
    ) {
      return ticket;
    }

    // 2. CLIENTE: Valida contra requesteremail
    if (userRolName === UserRol.CLIENTE) {
      if (
        ticket.requesterEmail &&
        user.email &&
        ticket.requesterEmail.toLowerCase() === user.email.toLowerCase()
      ) {
        return ticket;
      }
      throw new ForbiddenException('No tienes permiso para ver este ticket');
    }

    // 3. COLABORADOR: Comprobar creador de ticket o correo del solicitante
    if (userRolName === UserRol.COLABORADOR) {
      const creatorId = ticket.user?.id;
      const isCreator = Boolean(
        creatorId && Number(creatorId) === Number(user.id),
      );
      const isRequester = Boolean(
        ticket.requesterEmail &&
          user.email &&
          ticket.requesterEmail.toLowerCase() === user.email.toLowerCase(),
      );

      if (isCreator || isRequester) {
        return ticket;
      }
      throw new ForbiddenException('No tienes permiso para ver este ticket');
    }

    throw new ForbiddenException('No tienes permiso para ver este ticket');
  }

  async update(
    id: number,
    updateTicketDto: UpdateTicketDto,
    user: User,
  ): Promise<Tickets> {
    this.logger.debug(`Iniciando actualización para Ticket ID: ${id}`); // 🛑 LOG 1
    const oldTicket = await this.ticketsRepository.findOne({
      where: { id },
      relations: ['user', 'assignedTo'],
    });

    if (!oldTicket)
      throw new NotFoundException(`Ticket con ID ${id} no encontrado`);
    this.logger.debug(`Ticket antiguo recuperado. Status: ${oldTicket.status}`); // 🛑 LOG 2

    const oldStatus = oldTicket.status;
    const oldCategory = oldTicket.category;
    const ticket = oldTicket;

    const dtoAny = updateTicketDto as unknown as Record<string, unknown>;
    const newStatus = (dtoAny['status'] ?? dtoAny['estado']) as
      | TicketStatus
      | undefined;

    const newCategoryRaw = dtoAny['category'] ?? dtoAny['categoria'];
    const newCategory = this.resolveCategory(newCategoryRaw); // Lógica de Permisos de actualización (Supervisores y Soportistas)

    if (user.rol.name === UserRol.SUPERVISOR) {
      if (updateTicketDto.title || dtoAny['asunto'])
        ticket.title = (updateTicketDto.title || dtoAny['asunto']) as string;
      if (updateTicketDto.description || dtoAny['descripcion'])
        ticket.description = (updateTicketDto.description ||
          dtoAny['descripcion']) as string;

      if (updateTicketDto.type || dtoAny['tipo']) {
        ticket.type = (updateTicketDto.type || dtoAny['tipo']) as TicketType;
      }

      if (newCategory) {
        ticket.category = newCategory;
        ticket.deadlineAt = this.calculateDeadline(newCategory);
      }

      if (newStatus) ticket.status = newStatus;
    } else if (user.rol.name === UserRol.SOPORTISTA) {
      if (updateTicketDto.description || dtoAny['descripcion'])
        ticket.description = (updateTicketDto.description ||
          dtoAny['descripcion']) as string;
      if (updateTicketDto.type || dtoAny['tipo']) {
        ticket.type = (updateTicketDto.type || dtoAny['tipo']) as TicketType;
      }

      if (ticket.assignedTo && ticket.assignedTo.id === user.id) {
        if (newStatus) ticket.status = newStatus;
        if (newCategory) {
          ticket.category = newCategory;
          ticket.deadlineAt = this.calculateDeadline(newCategory);
        }
      } else {
        if (newStatus || newCategory) {
          throw new ForbiddenException(
            'No tienes permiso para cambiar estado o categoria de este ticket',
          );
        }
      }
    } else if (user.rol.name === UserRol.COLABORADOR) {
      if (ticket.user.id !== user.id)
        throw new ForbiddenException(
          'No tienes permiso para modificar este ticket',
        );
      if (updateTicketDto.title || dtoAny['asunto'])
        ticket.title = (updateTicketDto.title || dtoAny['asunto']) as string;
      if (updateTicketDto.description || dtoAny['descripcion'])
        ticket.description = (updateTicketDto.description ||
          dtoAny['descripcion']) as string;

      if (updateTicketDto.type || dtoAny['tipo']) {
        ticket.type = (updateTicketDto.type || dtoAny['tipo']) as TicketType;
      }
    } else if (user.rol.name === UserRol.CLIENTE) {
      throw new ForbiddenException(
        'El rol Cliente no puede modificar tickets, solo agregar seguimientos',
      );
    } else {
      throw new ForbiddenException(
        'No tienes permiso para modificar este ticket',
      );
    } // -------------------------------------------------------------------------
    // 🛑 Lógica de la Fecha de Finalización: Corregida
    // -------------------------------------------------------------------------

    if (
      newStatus === TicketStatus.FINALIZADO &&
      oldStatus !== TicketStatus.FINALIZADO
    ) {
      ticket.ultimaActualizacion = new Date();
      this.logger.debug(
        `Status cambiado a FINALIZADO. Configurando ultimaActualizacion.`,
      ); // 🛑 LOG 3
    } // -------------------------------------------------------------------------
    // 🛑 Guardado simple y seguro: Usamos .save() (Bloque corregido)
    // -------------------------------------------------------------------------

    this.logger.debug('Intentando guardar el ticket con .save()...'); // 🛑 LOG 4

    let updatedTicket: Tickets;
    try {
      // 1. Guardar la entidad (TypeORM resuelve las FKs y la fecha)
      await this.ticketsRepository.save(ticket); // 2. Recuperar el ticket completo con sus relaciones para la respuesta

      const retrievedTicket = await this.ticketsRepository.findOne({
        where: { id }, // Usamos el ID original
        relations: ['user', 'assignedTo'],
      });

      if (!retrievedTicket) {
        throw new NotFoundException(
          'Fallo al recuperar el ticket después de save en DB',
        );
      }

      updatedTicket = retrievedTicket; // Asignamos el ticket recuperado
    } catch (dbError) {
      this.logger.error('FALLO CRÍTICO AL GUARDAR EL TICKET EN DB:', dbError);
      throw new BadRequestException(
        'Error interno al actualizar el ticket. Consulte el log del servidor.',
      );
    }

    this.logger.debug(
      'Ticket guardado exitosamente. Revisando notificaciones...',
    ); // 🛑 LOG 5
    // eslint-disable-next-line prettier/prettier
    const destinatarioEmail = updatedTicket.requesterEmail ?? updatedTicket.user?.email;

    const statusChanged = oldStatus !== updatedTicket.status;
    const categoryChanged = oldCategory !== updatedTicket.category;

    if (destinatarioEmail && (statusChanged || categoryChanged)) {
      try {
        await this.emailService.enviarNotificacionActualizacion(
          destinatarioEmail,
          updatedTicket.id,
          updatedTicket.title,
          updatedTicket.status,
          updatedTicket.category,
        );
      } catch (err) {
        this.logger.warn(
          `[Update] No se pudo enviar notificación de cambio de ticket ${id}`,
          err,
        );
      }
    }

    this.logger.debug('Update finalizado.'); // 🛑 LOG 6
    return updatedTicket;
  } // ... (El resto del código de la clase se mantiene sin cambios) ...// --- Los demás métodos (remove, claim, assignTo, saveEvidence) no han sido modificados ---
  async remove(id: number, user: User): Promise<{ message: string }> {
    const ticket = await this.findOne(id, user);
    if (user.rol.name !== UserRol.SUPERVISOR)
      throw new ForbiddenException(
        'No tienes permiso para eliminar este ticket',
      );
    await this.ticketsRepository.remove(ticket);
    return { message: `Ticket con ID ${id} eliminado exitosamente` };
  }

  async claim(id: number, user: User): Promise<Tickets> {
    if (
      user.rol.name !== UserRol.SOPORTISTA &&
      user.rol.name !== UserRol.SUPERVISOR
    ) {
      throw new ForbiddenException(
        'No tienes permiso para reclamar este ticket',
      );
    }

    try {
      const result = await this.ticketsRepository.update(
        { id, assignedTo: IsNull() },
        { assignedTo: user },
      );

      if (result.affected && result.affected > 0) {
        const updated = await this.ticketsRepository.findOne({
          where: { id },
          relations: ['user', 'assignedTo'],
        });
        if (!updated) {
          throw new NotFoundException(
            `Ticket con ID ${id} no encontrado después de asignar`,
          );
        }
        return updated;
      }

      throw new BadRequestException('Ticket ya está asignado o no existe');
    } catch (err) {
      this.logger.error('[TicketsService.claim] error:', err);
      throw err;
    }
  }

  async assignTo(
    id: number,
    soportistaId: number,
    user: User,
  ): Promise<Tickets> {
    const ticket = await this.ticketsRepository.findOne({
      where: { id },
      relations: ['user', 'assignedTo'],
    });
    if (!ticket)
      throw new NotFoundException(`Ticket con ID ${id} no encontrado`);
    if (user.rol.name !== UserRol.SUPERVISOR)
      throw new ForbiddenException('No tienes permiso para asignar tickets');

    const soportista = await this.userRepository.findOne({
      where: { id: soportistaId },
      relations: ['rol'],
    });
    if (!soportista)
      throw new NotFoundException(
        `Soportista con ID ${soportistaId} no encontrado`,
      );
    if (soportista.rol?.name !== UserRol.SOPORTISTA)
      throw new BadRequestException(
        'El usuario seleccionado no es un soportista',
      );

    ticket.assignedTo = soportista;
    return await this.ticketsRepository.save(ticket);
  }

  async saveEvidence(ticketId: number, urls: string[], user: User) {
    const ticket = await this.ticketsRepository.findOne({
      where: { id: ticketId },
      relations: ['user', 'assignedTo'],
    });
    if (!ticket)
      throw new NotFoundException(`Ticket con ID ${ticketId} no encontrado`);

    const isCreator = ticket.user && ticket.user.id === user.id;
    const isAssigned = ticket.assignedTo && ticket.assignedTo.id === user.id;
    const isSupervisor = user?.rol?.name === UserRol.SUPERVISOR; // ✅ PERMISO: Se añade el rol CLIENTE al permiso si él es el solicitante original
    const isRequesterClient =
      user?.rol?.name === UserRol.CLIENTE &&
      ticket.requesterEmail === user.email;

    if (!isCreator && !isAssigned && !isSupervisor && !isRequesterClient)
      throw new ForbiddenException(
        'No autorizado para añadir evidencias a este ticket',
      );

    let evidencias: string[] = [];
    if (ticket.evidenciaUrl) {
      try {
        const parsed: unknown = JSON.parse(String(ticket.evidenciaUrl));
        if (Array.isArray(parsed)) {
          evidencias = (parsed as unknown[]).map((p) => String(p));
        } else {
          evidencias = [String(parsed)];
        }
      } catch {
        evidencias = [String(ticket.evidenciaUrl)];
      }
    }

    evidencias.push(...urls);
    ticket.evidenciaUrl = JSON.stringify(evidencias);
    await this.ticketsRepository.save(ticket);

    this.logger.log(
      `Evidences saved for ticket ${ticketId}: ${evidencias.length} file(s)`,
    );
    return { success: true, urls: evidencias };
  }

  async findAllForMetrics(): Promise<Tickets[]> {
    return await this.ticketsRepository.find({
      // Sin condición 'where' para traer tickets FINALIZADOS.
      relations: ['user', 'assignedTo'],
      order: { id: 'DESC' },
    });
  }
}

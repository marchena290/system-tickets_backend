import {
  BadRequestException,
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
import { Logger } from '@nestjs/common';

@Injectable()
export class TicketsService {
  logger = new Logger('TicketsService');
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
      return await this.ticketsRepository
        .createQueryBuilder('ticket')
        .leftJoinAndSelect('ticket.user', 'user')
        .leftJoinAndSelect('ticket.assignedTo', 'assignedTo')
        .where('assignedTo.id = :id', { id: user.id })
        .orWhere('assignedTo.id IS NULL')
        .getMany();
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

  // tickets.service.ts (fragmento dentro de update)
  async update(
    id: number,
    updateTicketDto: UpdateTicketDto,
    user: User,
  ): Promise<Tickets> {
    // Buscar ticket sin pasar por this.findOne (evita restricciones de visibilidad)
    const ticket = await this.ticketsRepository.findOne({
      where: { id },
      relations: ['user', 'assignedTo'],
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket con ID ${id} no encontrado`);
    }

    // Normalizar posibles keys
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const newStatus =
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (updateTicketDto as any).estado ?? (updateTicketDto as any).status;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const newCategory =
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (updateTicketDto as any).categoria ??
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (updateTicketDto as any).category;

    // SUPERVISOR: puede actualizar cualquier campo
    if (user.rol.name === UserRol.SUPERVISOR) {
      if (updateTicketDto.asunto) ticket.title = updateTicketDto.asunto;
      if (updateTicketDto.descripcion)
        ticket.description = updateTicketDto.descripcion;
      if (updateTicketDto.tipo) ticket.type = updateTicketDto.tipo;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      if (newCategory) ticket.category = newCategory;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      if (newStatus) ticket.status = newStatus;

      // SOPORTISTA: reglas más finas
    } else if (user.rol.name === UserRol.SOPORTISTA) {
      // permitimos siempre cambiar la descripción (si viene)
      if (updateTicketDto.descripcion)
        ticket.description = updateTicketDto.descripcion;

      // permitir cambiar estado/categoria solo si está asignado a él
      if (ticket.assignedTo && ticket.assignedTo.id === user.id) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        if (newStatus) ticket.status = newStatus;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        if (newCategory) ticket.category = newCategory;
      } else {
        // si intenta cambiar estado/categoría sin estar asignado, denegar
        if (newStatus || newCategory) {
          throw new ForbiddenException(
            'No tienes permiso para cambiar estado o categoria de este ticket',
          );
        }
      }

      // COLABORADOR: solo asunto/descripcion de su ticket
    } else if (user.rol.name === UserRol.COLABORADOR) {
      if (ticket.user.id !== user.id) {
        throw new ForbiddenException(
          'No tienes permiso para modificar este ticket',
        );
      }
      if (updateTicketDto.asunto) ticket.title = updateTicketDto.asunto;
      if (updateTicketDto.descripcion)
        ticket.description = updateTicketDto.descripcion;
    } else {
      // Otros roles: denegar por defecto
      throw new ForbiddenException(
        'No tienes permiso para modificar este ticket',
      );
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

  // Nuevo método: permitir que un SOPORTISTA (o SUPERVISOR) reclame un ticket no asignado
  async claim(id: number, user: User): Promise<Tickets> {
    // 1) Validar rol
    if (
      user.rol.name !== UserRol.SOPORTISTA &&
      user.rol.name !== UserRol.SUPERVISOR
    ) {
      throw new ForbiddenException(
        'No tienes permiso para reclamar este ticket',
      );
    }

    // 2) Intentar detectar nombre de columna FK a partir de la metadata
    let fkColumn = 'assignedToId'; // fallback
    try {
      const rel = this.ticketsRepository.metadata.relations.find(
        (r) =>
          r.propertyName === 'assignedTo' || r.propertyName === 'asignadoA',
      );
      if (rel && rel.joinColumns && rel.joinColumns.length > 0) {
        fkColumn =
          rel.joinColumns[0].databaseName ||
          rel.joinColumns[0].referencedColumn?.databaseName ||
          fkColumn;
      } else {
        // intentos de nombres comunes
        const common = [
          'assignedToId',
          'assigned_to_id',
          'assigned_to',
          'soportistaId',
          'soportista_id',
        ];
        for (const c of common) {
          if (
            this.ticketsRepository.metadata.columns.some(
              (col) => col.databaseName === c || col.propertyName === c,
            )
          ) {
            fkColumn = c;
            break;
          }
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      // no fatal: seguimos con fallback
    }

    const table = this.ticketsRepository.metadata.tableName;

    try {
      // 3) Intento Postgres: UPDATE ... RETURNING *
      const pgSql = `UPDATE "${table}" SET "${fkColumn}" = $1 WHERE id = $2 AND "${fkColumn}" IS NULL RETURNING id`;
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const rows: any = await this.ticketsRepository.query(pgSql, [
          user.id,
          id,
        ]);
        if (Array.isArray(rows) && rows.length > 0) {
          // devolver con relaciones
          const updated = await this.ticketsRepository.findOne({
            where: { id },
            relations: ['user', 'assignedTo'],
          });
          if (!updated)
            throw new NotFoundException(
              `Ticket con ID ${id} no encontrado después de asignar`,
            );
          return updated;
        }
        // si no se afectó ninguna fila -> ya asignado o no existe
        throw new BadRequestException('Ticket ya está asignado o no existe');
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (pgErr) {
        // si falla por sintaxis (no Postgres) o por otra razón, caemos al fallback
      }

      // 4) Fallback para MySQL/SQLite/otros: intentar UPDATE y luego leer
      const candidateCols = [
        fkColumn,
        'assignedToId',
        'assigned_to',
        'assigned_to_id',
        'soportistaId',
        'soportista_id',
      ];
      for (const col of candidateCols) {
        try {
          // Construcción SQL segura por driver: use `?` params
          // Usamos comillas simples/backticks dependiendo del driver; repository.query tolera SQL crudo.
          // Intentamos con backticks (MySQL) y sin RETURNING
          const updateSql = `UPDATE \`${table}\` SET \`${col}\` = ? WHERE id = ? AND \`${col}\` IS NULL`;
          await this.ticketsRepository.query(updateSql, [user.id, id]);

          // Leer el ticket y verificar si quedó asignado
          const maybe = await this.ticketsRepository.findOne({
            where: { id },
            relations: ['user', 'assignedTo'],
          });
          if (
            maybe &&
            maybe.assignedTo &&
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            (maybe.assignedTo as any).id === user.id
          ) {
            return maybe;
          }
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (innerErr) {
          // ignora y prueba la siguiente columna candidata
        }
      }

      // Si llegamos acá, nada funcionó
      throw new BadRequestException(
        'No se pudo reclamar el ticket (ya asignado o error en DB)',
      );
    } catch (err) {
      console.error('[TicketsService.claim] error:', err);
      // relanzar para que el controlador devuelva el status apropiado
      throw err;
    }
  }

  async assignTo(
    id: number,
    soportistaId: number,
    user: User,
  ): Promise<Tickets> {
    // 1. Encontrar ticket (sin aplicar permisos estrictos)
    const ticket = await this.ticketsRepository.findOne({
      where: { id },
      relations: ['user', 'assignedTo'],
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket con ID ${id} no encontrado`);
    }

    // 2. Validar rol de quien realiza la asignación (ya limitado por @Roles pero validamos por seguridad)
    if (
      user.rol.name !==
      UserRol.SUPERVISOR /* && user.rol.name !== UserRol.ADMIN */
    ) {
      throw new ForbiddenException('No tienes permiso para asignar tickets');
    }

    // 3. Buscar el usuario que será asignado y validar que es soportista
    const soportista = await this.userRepository.findOne({
      where: { id: soportistaId },
      relations: ['rol'],
    });

    if (!soportista) {
      throw new NotFoundException(
        `Soportista con ID ${soportistaId} no encontrado`,
      );
    }

    if (soportista.rol?.name !== UserRol.SOPORTISTA) {
      throw new BadRequestException(
        'El usuario seleccionado no es un soportista',
      );
    }

    // 4. Realizar la asignación
    ticket.assignedTo = soportista;
    const saved = await this.ticketsRepository.save(ticket);

    return saved;
  }

  async saveEvidence(ticketId: number, urls: string[], user: User) {
    const ticket = await this.ticketsRepository.findOne({
      where: { id: ticketId },
      relations: ['user', 'assignedTo'],
    });
    if (!ticket)
      throw new NotFoundException(`Ticket con ID ${ticketId} no encontrado`);

    // Permisos: creador, asignado o supervisor
    const isCreator = ticket.user && ticket.user.id === user.id;
    const isAssigned = ticket.assignedTo && ticket.assignedTo.id === user.id;
    const isSupervisor = user?.rol?.name === UserRol.SUPERVISOR;
    if (!isCreator && !isAssigned && !isSupervisor) {
      throw new ForbiddenException(
        'No autorizado para añadir evidencias a este ticket',
      );
    }

    // Normalizar campo existente a array
    let evidencias: string[] = [];
    if (ticket.evidenciaUrl) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const parsed = JSON.parse(String(ticket.evidenciaUrl));
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        if (Array.isArray(parsed)) evidencias = parsed;
        else evidencias = [String(parsed)];
      } catch {
        evidencias = [String(ticket.evidenciaUrl)];
      }
    }

    evidencias.push(...urls);

    // Guardar siempre como JSON-string (compatible con columna text/string)
    ticket.evidenciaUrl = JSON.stringify(evidencias);

    await this.ticketsRepository.save(ticket);

    // <-- Aquí es donde añades el log y el return
    this.logger.log(
      `Evidences saved for ticket ${ticketId}: ${evidencias.length} file(s)`,
    );
    return { success: true, urls: evidencias };
  }
}

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { Tickets, TicketStatus } from '../entities/ticket.entity';
import { User } from '../entities/user.entity';
import { ReportQueryDto } from './dto/report-query.dto';

// Interfaz para tipar el resultado del cálculo de tiempo (AVG)
interface AvgClosureResult {
  avg_seconds: string | null;
}

// Interfaz para el conteo de tickets por entidad
export interface GroupedCountResult {
  group_name: string;
  count: string;
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectRepository(Tickets)
    private readonly ticketRepository: Repository<Tickets>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}
  /**
   * Helper para parsear fechas y aplicar filtros de rango.
   */

  private parseDateRange(query: ReportQueryDto): {
    start: Date | null;
    end: Date | null;
  } {
    const start = query.startDate ? new Date(query.startDate) : null;
    const end = query.endDate ? new Date(query.endDate) : null;

    if (start && isNaN(start.getTime())) {
      throw new BadRequestException('Fecha de inicio inválida.');
    }
    if (end && isNaN(end.getTime())) {
      throw new BadRequestException('Fecha de fin inválida.');
    }
    if (end) end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  async getTotalTickets(): Promise<number> {
    return this.ticketRepository.count();
  }

  async getSummaryByStatus(
    query: ReportQueryDto = {},
  ): Promise<GroupedCountResult[]> {
    const { start, end } = this.parseDateRange(query);

    let queryBuilder = this.ticketRepository
      .createQueryBuilder('ticket')
      .select('ticket.status', 'group_name')
      .addSelect('COUNT(*)', 'count')
      .groupBy('ticket.status');

    if (start && end) {
      queryBuilder = queryBuilder.where(
        'ticket.fechaCreacion BETWEEN :start AND :end',
        { start: start, end: end },
      );
    }

    return queryBuilder.getRawMany();
  }

  async getSummaryByCategory(
    query: ReportQueryDto = {},
  ): Promise<GroupedCountResult[]> {
    const { start, end } = this.parseDateRange(query);

    let queryBuilder = this.ticketRepository
      .createQueryBuilder('ticket')
      .select('ticket.category', 'group_name')
      .addSelect('COUNT(*)', 'count')
      .groupBy('ticket.category');

    if (start && end) {
      queryBuilder = queryBuilder.where(
        'ticket.fechaCreacion BETWEEN :start AND :end',
        { start: start, end: end },
      );
    }

    return queryBuilder.getRawMany();
  }

  async getLoadBySoportista(query: ReportQueryDto = {}): Promise<any[]> {
    const { start, end } = this.parseDateRange(query);

    let queryBuilder = this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoin('ticket.assignedTo', 'soportista')
      .select('soportista.nombreCompleto', 'soportistaName')
      .addSelect('COUNT(*)', 'count')
      .addSelect(
        // 1. Métrica de Tickets ABIERTOS (status != FINALIZADO)
        'SUM(CASE WHEN ticket.status != :finalizado THEN 1 ELSE 0 END)',
        'openTickets',
      )
      .addSelect(
        // 2. Métrica de Tickets RESUELTOS (status = FINALIZADO)
        'SUM(CASE WHEN ticket.status = :finalizado THEN 1 ELSE 0 END)',
        'resolvedTickets',
      )
      .setParameter('finalizado', TicketStatus.FINALIZADO)
      .groupBy('soportista.nombreCompleto, soportista.id');

    if (start && end) {
      queryBuilder = queryBuilder.where(
        'ticket.fechaCreacion BETWEEN :start AND :end',
        { start: start, end: end },
      );
    }
    try {
      const rawResult = await queryBuilder.getRawMany();
      return rawResult;
    } catch (error) {
      this.logger.error(
        'Error al ejecutar getLoadBySoportista:',
        (error as Error).stack,
      );
      return [];
    }
  }

  async ticketsByUser(): Promise<any[]> {
    return this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoin('ticket.user', 'user')
      .select('user.nombreCompleto', 'userName')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.nombreCompleto, user.id')
      .getRawMany();
  }

  async listTickets(query: ReportQueryDto = {}): Promise<Tickets[]> {
    const { start, end } = this.parseDateRange(query);

    const whereCondition: FindOptionsWhere<Tickets> = {};

    if (start && end) {
      whereCondition.fechaCreacion = Between(start, end);
    }

    if (query.status) {
      whereCondition.status = query.status;
    }

    return this.ticketRepository.find({
      where: whereCondition,
      relations: ['assignedTo', 'user'],
      order: { fechaCreacion: 'DESC' },
    });
  }
  // ============== MÉTODOS DE MÉTRICAS CENTRALES PARA EL CRON / DASHBOARD ==============
  /**
   * Obtiene métricas clave del periodo, usado por el ReportSchedulerService.
   */
  async getMetrics(startDate: Date, endDate: Date) {
    this.logger.log('Calculando métricas clave...'); // 1. Tickets Cerrados en el Periodo

    const ticketsCerrados = await this.ticketRepository.count({
      where: {
        status: TicketStatus.FINALIZADO,
        ultimaActualizacion: Between(startDate, endDate),
      },
    }); // 2. Tickets Abiertos Actualmente

    const ticketsAbiertosActuales = await this.ticketRepository.count({
      where: [
        { status: TicketStatus.ABIERTO },
        { status: TicketStatus.EN_REVISION },
        { status: TicketStatus.EN_PROGRESO },
      ],
    }); // 3. CÁLCULO DE TIEMPO PROMEDIO DE CIERRE (SLA)

    const avgClosureQuery = await this.ticketRepository
      .createQueryBuilder('ticket')
      .select(
        'AVG(EXTRACT(EPOCH FROM (ticket.ultimaActualizacion - ticket.fechaCreacion)))',
        'avg_seconds',
      )
      .where(
        'ticket.status = :finalizado AND ticket.ultimaActualizacion BETWEEN :start AND :end',
        {
          finalizado: TicketStatus.FINALIZADO,
          start: startDate,
          end: endDate,
        },
      )
      .getRawOne<AvgClosureResult>();

    const avgSeconds = parseFloat(avgClosureQuery?.avg_seconds || '0');
    const tiempoPromedioCierreHoras = avgSeconds / 3600;

    return {
      ticketsCerrados,
      tiempoPromedioCierreHoras,
      ticketsAbiertosActuales,
    };
  } /**
   * 7. Resumen general para un dashboard.
   */

  async summary(query: ReportQueryDto = {}) {
    // Definimos un rango por defecto (ej. desde el inicio del año)
    const defaultStart = new Date(new Date().getFullYear(), 0, 1);
    const defaultEnd = new Date();

    const [summaryByStatus, summaryByCategory, totalTickets, metricsPeriodo] =
      await Promise.all([
        this.getSummaryByStatus(query),
        this.getSummaryByCategory(query),
        this.getTotalTickets(),
        this.getMetrics(defaultStart, defaultEnd),
      ]); // 🎯 CORRECCIÓN DE MAPEO: Aseguramos que los alias coincidan con el frontend

    return {
      totalTickets,
      summaryByStatus,
      summaryByCategory,
      metricsPeriodo: {
        // Mapeo de métricas clave que espera el frontend
        ticketsAbiertos: metricsPeriodo.ticketsAbiertosActuales,
        ticketsFinalizados: metricsPeriodo.ticketsCerrados,
        tiempoPromedio: metricsPeriodo.tiempoPromedioCierreHoras,
      },
    };
  }
}

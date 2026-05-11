import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Tickets, TicketStatus } from '../entities/ticket.entity';

interface AvgClosureResult {
  avg_seconds: string | null;
}

export interface GroupedCountResult {
  status: string;
  count: string;
}

export interface ReportMetrics {
  ticketsCerrados: number;
  tiempoPromedioCierreHoras: number;
  ticketsAbiertosActuales: number;
  ticketsPorEstado: GroupedCountResult[];
}

@Injectable()
export class ReportDataService {
  private readonly logger = new Logger(ReportDataService.name);

  constructor(
    @InjectRepository(Tickets)
    private readonly ticketRepository: Repository<Tickets>,
  ) {} /**
   * Obtiene las métricas clave del periodo.
   * @param startDate - Fecha de inicio del periodo del reporte
   * @param endDate - Fecha de fin del periodo del reporte
   */ // 💡 CORRECCIÓN 2: Aplicar la interfaz ReportMetrics como tipo de retorno

  async getMetrics(startDate: Date, endDate: Date): Promise<ReportMetrics> {
    this.logger.log('Calculando métricas...'); // 1. Tickets Cerrados en el Periodo

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
    }); // 3. CÁLCULO REALISTA (Tiempo Promedio de Cierre)

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
    const tiempoPromedioCierreHoras = avgSeconds / 3600; // 4. Reporte por estado

    const statusCounts = await this.ticketRepository
      .createQueryBuilder('ticket')
      .select('ticket.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('ticket.status')
      .getRawMany<GroupedCountResult>();

    return {
      ticketsCerrados,
      tiempoPromedioCierreHoras,
      ticketsAbiertosActuales,
      ticketsPorEstado: statusCounts,
    };
  }
}

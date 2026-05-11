import { Injectable, Logger } from '@nestjs/common';
import { TicketsService } from 'src/tickets/tickets.service';
import { UsersService } from 'src/users/users.service';
import { TicketStatus, Tickets } from 'src/entities/ticket.entity';
import { DashboardMetrics } from './interfaces/dashboard-metrics.interface';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly ticketsService: TicketsService,
    private readonly usersService: UsersService,
  ) {}

  // ----------------------------------------------------------------------
  // ✅ MÉTODO PRINCIPAL: OBTENER TODAS LAS MÉTRICAS
  // ----------------------------------------------------------------------
  async getMetrics(): Promise<DashboardMetrics> {
    this.logger.log('Calculando métricas del Dashboard...');

    // 1. Obtener todos los datos necesarios
    const allTickets = await this.ticketsService.findAllForMetrics();
    const allSoportistas = await this.usersService.findAllSoportistas();

    // 2. Cálculos de Conteo Global
    const totalTickets = allTickets.length;
    const soportistasActivos = allSoportistas.filter((u) => u.isActive).length;

    // 3. Cálculos de Tiempo y Resueltos del Mes
    const { resolvedThisMonth, averageResolutionTime } =
      this.calculateTicketMetrics(allTickets);

    // 4. CÁLCULO DE CONTEO POR ESTADO (Se llama a la función optimizada)
    const { abiertos, enProceso, finalizados } =
      this.calculateStatusCounts(allTickets);

    // 5. Retorno de las métricas
    return {
      totalTickets: totalTickets,
      soportistasActivos: soportistasActivos,
      resueltosEsteMes: resolvedThisMonth,
      tiempoPromedioResolucion: averageResolutionTime,
      // ✅ Se retornan los conteos de estado
      ticketsAbiertos: abiertos,
      ticketsEnProceso: enProceso,
      ticketsFinalizados: finalizados,
    };
  }

  // ----------------------------------------------------------------------
  // ✅ Lógica: Contar tickets por estado (Iteración única)
  // ----------------------------------------------------------------------
  private calculateStatusCounts(tickets: Tickets[]): {
    abiertos: number;
    enProceso: number;
    finalizados: number;
  } {
    let abiertos = 0;
    let enProceso = 0;
    let finalizados = 0;

    for (const ticket of tickets) {
      if (!ticket.status) continue;

      switch (ticket.status) {
        case TicketStatus.ABIERTO:
          abiertos++;
          break;
        case TicketStatus.EN_REVISION:
        case TicketStatus.EN_PROGRESO:
          enProceso++;
          break;
        case TicketStatus.FINALIZADO:
          finalizados++;
          break;
        default:
          this.logger.warn(
            `Ticket ${ticket.id} tiene un estado desconocido: ${String(ticket.status)}. Contando como 'En Proceso'.`,
          );
          enProceso++;
          break;
      }
    }

    return { abiertos, enProceso, finalizados };
  }

  // ----------------------------------------------------------------------
  // ✅ Lógica de Cálculo de Tickets (Tiempo Promedio y Resueltos del Mes)
  // ----------------------------------------------------------------------
  private calculateTicketMetrics(tickets: Tickets[]) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let resolvedThisMonth = 0;
    let totalResolutionSeconds = 0;
    let resolvedTicketsCount = 0;

    for (const ticket of tickets) {
      if (ticket.status === TicketStatus.FINALIZADO) {
        if (ticket.fechaCreacion && ticket.ultimaActualizacion) {
          const created = new Date(ticket.fechaCreacion);
          const resolved = new Date(ticket.ultimaActualizacion);

          // CÁLCULO DE RESUELTOS ESTE MES (Filtro por fecha de cierre)
          if (resolved >= startOfMonth) {
            resolvedThisMonth++;
          }

          // CÁLCULO DE TIEMPO PROMEDIO (Resta de fechas)
          if (resolved > created) {
            const resolutionTimeMs = resolved.getTime() - created.getTime();
            totalResolutionSeconds += resolutionTimeMs / 1000;
            resolvedTicketsCount++;
          }
        }
      }
    }

    const averageResolutionTimeSeconds =
      resolvedTicketsCount > 0
        ? totalResolutionSeconds / resolvedTicketsCount
        : 0;

    return {
      resolvedThisMonth,
      averageResolutionTime: this.formatTime(averageResolutionTimeSeconds),
    };
  }

  // ----------------------------------------------------------------------
  // ✅ Función auxiliar para formatear tiempo (Se corrige la lógica)
  // ----------------------------------------------------------------------
  private formatTime(totalSeconds: number): string {
    if (totalSeconds === 0) return '0 segundos';

    const total = Math.round(totalSeconds);
    const S = total % 60;
    const M = Math.floor((total / 60) % 60);
    const H = Math.floor((total / (60 * 60)) % 24);
    const D = Math.floor(total / (60 * 60 * 24));

    const parts: string[] = [];

    if (D > 0) parts.push(`${D} d`);
    if (H > 0) parts.push(`${H} h`);
    if (M > 0) parts.push(`${M} m`);
    if (S > 0) parts.push(`${S} s`);

    if (parts.length === 0 && totalSeconds > 0) {
      return `${totalSeconds.toFixed(0)} s`;
    }

    return parts.join(' ');
  }
}

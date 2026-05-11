import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EmailService } from '../email/email.service';
import { ReportDataService, ReportMetrics } from './report-data.service';

@Injectable()
export class ReportSchedulerService {
  private readonly logger = new Logger(ReportSchedulerService.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly reportDataService: ReportDataService,
  ) {} // 1. REPORTE SEMANAL

  @Cron('0 9 * * 1') // Cada lunes a las 9:00 AM
  async handleWeeklyReportCron() {
    this.logger.log('📢 Ejecutando Reporte Semanal...');

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);

    try {
      // 💡 Aplicamos el tipo ReportMetrics
      const metrics: ReportMetrics = await this.reportDataService.getMetrics(
        startDate,
        endDate,
      );

      this.logger.log(
        `Métricas obtenidas: ${metrics.ticketsCerrados} cerrados, ${metrics.ticketsAbiertosActuales} abiertos.`,
      );

      await this.emailService.enviarReporteSemanal(
        'direccion_gestion@tudominio.com',
        {
          ticketsCerrados: metrics.ticketsCerrados,
          tiempoPromedioCierreHoras: metrics.tiempoPromedioCierreHoras,
          ticketsAbiertosActuales: metrics.ticketsAbiertosActuales,
          ticketsPorEstado: metrics.ticketsPorEstado,
        },
        'Semanal',
      );
      this.logger.log('✅ Reporte Semanal enviado con éxito.');
    } catch (error) {
      this.logger.error(
        '❌ Fallo al ejecutar el Cron de Reporte Semanal.',
        error,
      );
    }
  }

  // 2. REPORTE DIARIO
  @Cron('0 0 * * *')
  async handleDailyReportCron() {
    this.logger.log('📢 Ejecutando Reporte Diario...'); // 1. Definir el Período (Día anterior completo)

    const end = new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    end.setDate(end.getDate()); // El final debe ser el día de hoy antes de la medianoche
    end.setHours(0, 0, 0, 0);
    const finalEnd = new Date(end.getTime() - 1); // un milisegundo antes de medianoche

    try {
      // 2. ⚡️ OBTENER DATOS
      // 💡 Aplicamos el tipo ReportMetrics
      const metrics: ReportMetrics = await this.reportDataService.getMetrics(
        start,
        finalEnd,
      ); // 3. 📧 ENVIAR CORREO

      const dailyRecipients = 'supervisor@dominio.com';

      await this.emailService.enviarReporteSemanal(
        dailyRecipients,
        {
          ticketsCerrados: metrics.ticketsCerrados,
          tiempoPromedioCierreHoras: metrics.tiempoPromedioCierreHoras,
          ticketsAbiertosActuales: metrics.ticketsAbiertosActuales,
          ticketsPorEstado: metrics.ticketsPorEstado,
        },
        'Diario',
      );

      this.logger.log('✅ Reporte Diario enviado con éxito.');
    } catch (error) {
      this.logger.error(
        '❌ Error al ejecutar el Cron de Reporte Diario.',
        error,
      );
    }
  }
}

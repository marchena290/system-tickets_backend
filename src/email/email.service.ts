import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as nodemailer from 'nodemailer';
import { Repository } from 'typeorm';
import {
  NotificationLog,
  NotificationStatus,
} from '../entities/notification-log.entity';
import { TicketCategory, TicketStatus } from 'src/entities/ticket.entity';
import { DashboardMetrics } from 'src/dashboard/interfaces/dashboard-metrics.interface';
import {
  ReportMetrics,
  GroupedCountResult,
} from '../reports/report-data.service';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(NotificationLog)
    private readonly notificationLogRepository: Repository<NotificationLog>,
  ) {
    // Configuración segura del transporter
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: this.configService.get<string>('SMTP_PORT') === '465',
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  /**
   * Formatea ENUMs de forma legible, reemplazando guiones bajos por espacios
   * y capitalizando la primera letra de cada palabra.
   */
  private formatEnumName(value: string | null | undefined): string {
    if (!value) return 'No Definido';

    // 1. Reemplazar guiones bajos con espacios
    let formatted = value.toString().replace(/_/g, ' ');

    // 2. Formato de Título
    if (formatted.length > 0) {
      formatted = formatted.toLowerCase();
      formatted = formatted
        .split(' ')
        .map((word) => {
          if (word.length === 0) return '';
          return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ');
    }
    return formatted;
  }

  // ----------------------------------------------------------------------
  // ✅ MÉTODO FALTANTE: ENVÍO DE REPORTE DE DASHBOARD
  // Este método es llamado por DashboardController
  // ----------------------------------------------------------------------
  async sendDashboardReport(
    recipientEmail: string,
    supervisorName: string,
    metrics: DashboardMetrics, // <-- Usa la interfaz correcta del Dashboard
  ): Promise<void> {
    const subject = `[Dashboard Reporte] Métricas de Rendimiento - ${new Date().toLocaleDateString()}`;

    const htmlBody = `
      <html>
        <body style="font-family: sans-serif;">
          <h2>Hola, ${supervisorName} 👋</h2>
          <h1>📈 Resumen Rápido del Dashboard</h1>
          <p>Se ha generado el reporte instantáneo con las métricas clave de la plataforma:</p>
          
          <table border="1" style="width: 80%; border-collapse: collapse; margin: 20px 0; border: 1px solid #ddd;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="padding: 12px; text-align: left;">Métrica</th>
                <th style="padding: 12px; text-align: left;">Valor</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 10px;">Total de Tickets en el Sistema</td>
                <td style="padding: 10px; font-weight: bold;">${metrics.totalTickets}</td>
              </tr>
              <tr>
                <td style="padding: 10px;">Soportistas Activos</td>
                <td style="padding: 10px; font-weight: bold;">${metrics.soportistasActivos}</td>
              </tr>
              <tr>
                <td style="padding: 10px; background-color: #e6ffe6;">Tickets Resueltos Este Mes</td>
                <td style="padding: 10px; font-weight: bold; background-color: #e6ffe6;">${metrics.resueltosEsteMes}</td>
              </tr>
              <tr>
                <td style="padding: 10px;">Tiempo Promedio de Resolución</td>
                <td style="padding: 10px; font-weight: bold; color: #007bff;">${metrics.tiempoPromedioResolucion}</td>
              </tr>
            </tbody>
          </table>

          <p>Este reporte se ha enviado a petición suya.</p>
          <p>Atentamente,<br>Sistema de Tickets</p>
        </body>
      </html>
    `;

    // 1. 💾 CREAR EL REGISTRO DE NOTIFICACIÓN (PENDIENTE)
    let logEntry = this.notificationLogRepository.create({
      ticketId: 'DASHBOARD_REPORT', // Valor fijo para reportes de Dashboard
      userId: supervisorName,
      toEmail: recipientEmail,
      subject: subject,
      body: htmlBody,
      status: NotificationStatus.PENDING,
      attempts: 1,
    });
    logEntry = await this.notificationLogRepository.save(logEntry);

    try {
      // 2. 📧 INTENTAR ENVIAR EL CORREO
      await this.transporter.sendMail({
        from: `"${this.configService.get<string>('SMTP_FROM_NAME')}" <${this.configService.get<string>('SMTP_FROM_EMAIL')}>`,
        to: recipientEmail,
        subject: subject,
        html: htmlBody,
      });

      // 3. ✅ ACTUALIZAR EL REGISTRO (ÉXITO)
      await this.notificationLogRepository.update(logEntry.id, {
        status: NotificationStatus.SENT,
        processedAt: new Date(),
      });
      this.logger.log(
        `Reporte de Dashboard enviado con éxito a ${recipientEmail}`,
      );
    } catch (error: unknown) {
      // 4. ❌ ACTUALIZAR EL REGISTRO (FALLO)
      const message = error instanceof Error ? error.message : String(error);
      await this.notificationLogRepository.update(logEntry.id, {
        status: NotificationStatus.FAILED,
        processedAt: new Date(),
        error: message,
      });
      this.logger.error(
        `Error al enviar Reporte de Dashboard a ${recipientEmail}:`,
        message,
      );
      // Es crucial relanzar el error para que el controlador pueda detectarlo y devolver 500
      throw new Error(`Fallo el envío del correo: ${message}`);
    }
  }

  // Método para confirmar la creación de un ticket con logging
  async enviarConfirmacionCreacionTicket(
    destinatarioEmail: string,
    ticketId: number,
    asunto: string,
    userId?: string | number, // Opcional, si tienes el ID del creador
  ): Promise<void> {
    const subject = `[Ticket Creado] Confirmación de su caso #${ticketId}`;
    const htmlBody = `
        <h1>¡Su ticket ha sido creado con éxito!</h1>
        <p>...</p>
        <p><strong>ID del Ticket:</strong> <h2>#${ticketId}</h2></p>
        <p>...</p>
        <p>Gracias por su reporte. Atentamente, El Equipo de Soporte.</p>
      `;

    // 1. 💾 CREAR EL REGISTRO DE NOTIFICACIÓN (PENDIENTE)
    let logEntry = this.notificationLogRepository.create({
      ticketId: String(ticketId),
      userId: String(userId), // Guardar como string
      toEmail: destinatarioEmail,
      subject: subject,
      body: htmlBody,
      status: NotificationStatus.PENDING,
      attempts: 1,
    });
    logEntry = await this.notificationLogRepository.save(logEntry); // Guarda y obtiene el ID de la fila

    try {
      // 2. 📧 INTENTAR ENVIAR EL CORREO
      await this.transporter.sendMail({
        from: '"Sistema de Tickets" <no-reply@tudominio.com>',
        to: destinatarioEmail,
        subject: subject,
        html: htmlBody,
      });

      // 3. ✅ ACTUALIZAR EL REGISTRO (ÉXITO)
      await this.notificationLogRepository.update(logEntry.id, {
        status: NotificationStatus.SENT,
        processedAt: new Date(),
      });
      this.logger.log(
        `Correo de confirmación enviado con éxito para el Ticket #${ticketId}`,
      );
    } catch (error: unknown) {
      // 4. ❌ ACTUALIZAR EL REGISTRO (FALLO)
      const message = error instanceof Error ? error.message : String(error);
      await this.notificationLogRepository.update(logEntry.id, {
        status: NotificationStatus.FAILED,
        processedAt: new Date(),
        error: message,
      });
      this.logger.error(
        `Error al enviar correo de creación para el Ticket #${ticketId}:`,
        message,
      );
    }
  }

  // Notificación cuando se añade un seguimiento a un ticket
  async enviarNotificacionSeguimiento(
    destinatarioEmail: string,
    ticketId: number,
    comentario: string,
  ): Promise<void> {
    const subject = `[Ticket #${ticketId}] Nuevo seguimiento añadido`;
    const htmlBody = `
      <h3>Se ha añadido un nuevo seguimiento a su ticket #${ticketId}</h3>
      <p>${comentario}</p>
      <p>Si tiene alguna duda responda a este correo.</p>
    `;

    let logEntry = this.notificationLogRepository.create({
      ticketId: String(ticketId),
      userId: 'system',
      toEmail: destinatarioEmail,
      subject,
      body: htmlBody,
      status: NotificationStatus.PENDING,
      attempts: 1,
    });
    logEntry = await this.notificationLogRepository.save(logEntry);

    try {
      await this.transporter.sendMail({
        from: `"${this.configService.get<string>('SMTP_FROM_NAME')}" <${this.configService.get<string>('SMTP_FROM_EMAIL')}>`,
        to: destinatarioEmail,
        subject: subject,
        html: htmlBody,
      });

      await this.notificationLogRepository.update(logEntry.id, {
        status: NotificationStatus.SENT,
        processedAt: new Date(),
      });
      this.logger.log(
        `Notificación de seguimiento enviada para el Ticket #${ticketId}`,
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      await this.notificationLogRepository.update(logEntry.id, {
        status: NotificationStatus.FAILED,
        processedAt: new Date(),
        error: message,
      });
      this.logger.error(
        `Error al enviar notificación de seguimiento para Ticket #${ticketId}:`,
        message,
      );
    }
  }

  // Notificación de actualización de estado/categoría
  async enviarNotificacionActualizacion(
    destinatarioEmail: string,
    ticketId: number,
    title: string,
    newStatus: TicketStatus,
    newCategory: TicketCategory | null,
  ): Promise<void> {
    // Aplicar el formato para quitar guiones bajos
    const formattedStatus = this.formatEnumName(newStatus);
    const formattedCategory = this.formatEnumName(newCategory);

    const subject = `[Ticket #${ticketId}] Su caso ha sido actualizado`;
    const htmlBody = `
      <h1>Actualización de su Ticket #${ticketId}</h1>
      <p><strong>Asunto:</strong> ${title}</p>
      <p>El estado o la categoría de su ticket han cambiado:</p>
      <ul>
        <li><strong>Nuevo Estado:</strong> ${formattedStatus}</li>
        <li><strong>Nueva Categoría/Prioridad:</strong> ${formattedCategory}</li>
      </ul>
      <p>Por favor, ingrese a la plataforma para ver los detalles.</p>
    `;

    let logEntry = this.notificationLogRepository.create({
      ticketId: String(ticketId),
      userId: 'system',
      toEmail: destinatarioEmail,
      subject,
      body: htmlBody,
      status: NotificationStatus.PENDING,
      attempts: 1,
    });
    logEntry = await this.notificationLogRepository.save(logEntry);

    try {
      await this.transporter.sendMail({
        from: `"${this.configService.get<string>('SMTP_FROM_NAME')}" <${this.configService.get<string>('SMTP_FROM_EMAIL')}>`,
        to: destinatarioEmail,
        subject: subject,
        html: htmlBody,
      });

      await this.notificationLogRepository.update(logEntry.id, {
        status: NotificationStatus.SENT,
        processedAt: new Date(),
      });
      this.logger.log(
        `Notificación de actualización enviada para el Ticket #${ticketId}`,
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      await this.notificationLogRepository.update(logEntry.id, {
        status: NotificationStatus.FAILED,
        processedAt: new Date(),
        error: message,
      });
      this.logger.error(
        `Error al enviar notificación de actualización para Ticket #${ticketId}:`,
        message,
      );
    }
  }

  // Método para enviar credenciales al nuevo usuario cliente
  async enviarCredencialesCliente(
    email: string,
    password: string,
  ): Promise<void> {
    const subject = `¡Bienvenido! Tus credenciales de acceso a la Plataforma de Tickets`;
    const htmlContent = `
      <html>
        <body style="font-family: sans-serif;">
          <h2>👋 Hola, ${email}</h2>
          <p>Hemos creado una cuenta de cliente para que puedas seguir tus tickets.</p>
          <p>Utiliza las siguientes credenciales para iniciar sesión en nuestra plataforma:</p>
          <div style="border: 1px solid #ccc; padding: 15px; background-color: #f9f9f9;">
            <strong>Correo:</strong> ${email}<br>
            <strong>Contraseña Temporal:</strong> 
            <span style="color: #d9534f; font-weight: bold;">${password}</span>
          </div>
          <p>Por favor, cambia tu contraseña inmediatamente después de iniciar sesión.</p>
          <p>Atentamente,<br>El Equipo de Soporte.</p>
        </body>
      </html>
      `;

    await this.transporter.sendMail({
      from: `"${this.configService.get<string>('SMTP_FROM_NAME')}" <${this.configService.get<string>('SMTP_FROM_EMAIL')}>`, // Usar tus credenciales de envío
      to: email,
      subject: subject,
      html: htmlContent,
    });
  }

  // Método de reporte existente que usa ReportMetrics del módulo de reportes
  async enviarReporteSemanal(
    destinatarioEmail: string,
    metrics: ReportMetrics, // <--- Tipo de Reportes, no de Dashboard
    periodo: string = 'Semanal',
  ): Promise<void> {
    const subject = `[Reporte ${periodo}] Métricas de Tickets - ${new Date().toLocaleDateString()}`;

    // Formateo de métricas para el cuerpo del correo
    const tiempoPromedio = `${metrics.tiempoPromedioCierreHoras.toFixed(2)} horas`;

    // Generar la tabla de conteo por estado
    const statusRows = metrics.ticketsPorEstado
      .map(
        (item: GroupedCountResult) => `
        <tr>
          <td style="padding: 10px;">${this.formatEnumName(item.status)}</td>
          <td style="padding: 10px; font-weight: bold;">${item.count}</td>
        </tr>
      `,
      )
      .join('');

    const htmlBody = `
      <h1>📊 Reporte de Métricas de Tickets (${periodo})</h1>
      <p>Estimado equipo de gestión,</p>
      <p>A continuación, se presentan las métricas clave de la plataforma de tickets para el período reciente:</p>
      
      <table border="1" style="width: 80%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th style="padding: 10px; text-align: left;">Métrica</th>
            <th style="padding: 10px; text-align: left;">Valor</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 10px;">Tickets Cerrados en el Periodo</td>
            <td style="padding: 10px; font-weight: bold;">${metrics.ticketsCerrados}</td>
          </tr>
          <tr>
            <td style="padding: 10px;">Tickets Abiertos Actualmente</td>
            <td style="padding: 10px; font-weight: bold;">${metrics.ticketsAbiertosActuales}</td>
          </tr>
          <tr>
            <td style="padding: 10px;">Tiempo Promedio de Cierre</td>
            <td style="padding: 10px; font-weight: bold; color: #007bff;">${tiempoPromedio}</td>
          </tr>
        </tbody>
      </table>

      <h2>Detalle por Estado de Ticket (Actuales)</h2>
      <table border="1" style="width: 80%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th style="padding: 10px; text-align: left;">Estado</th>
            <th style="padding: 10px; text-align: left;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${statusRows}
        </tbody>
      </table>


      <p>Por favor, ingrese a la plataforma para un análisis más detallado.</p>
      <p>Atentamente,<br>Sistema de Tickets</p>
      `;

    // 1. 💾 CREAR EL REGISTRO DE NOTIFICACIÓN (PENDIENTE)
    let logEntry = this.notificationLogRepository.create({
      ticketId: 'REPORTE', // Usar un valor fijo para reportes globales
      userId: 'SYSTEM_REPORT',
      toEmail: destinatarioEmail,
      subject: subject,
      body: htmlBody,
      status: NotificationStatus.PENDING,
      attempts: 1,
    });
    logEntry = await this.notificationLogRepository.save(logEntry);

    try {
      // 2. 📧 INTENTAR ENVIAR EL CORREO
      await this.transporter.sendMail({
        from: `"${this.configService.get<string>('SMTP_FROM_NAME')}" <${this.configService.get<string>('SMTP_FROM_EMAIL')}>`,
        to: destinatarioEmail,
        subject: subject,
        html: htmlBody,
      });

      // 3. ✅ ACTUALIZAR EL REGISTRO (ÉXITO)
      await this.notificationLogRepository.update(logEntry.id, {
        status: NotificationStatus.SENT,
        processedAt: new Date(),
      });
      this.logger.log(
        `Reporte ${periodo} enviado con éxito a ${destinatarioEmail}`,
      );
    } catch (error: unknown) {
      // 4. ❌ ACTUALIZAR EL REGISTRO (FALLO)
      const message = error instanceof Error ? error.message : String(error);
      await this.notificationLogRepository.update(logEntry.id, {
        status: NotificationStatus.FAILED,
        processedAt: new Date(),
        error: message,
      });
      this.logger.error(
        `Error al enviar reporte ${periodo} a ${destinatarioEmail}:`,
        message,
      );
    }
  }
}

import { Controller, Get, UseGuards, Post, Req } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRol } from 'src/entities/rol.entity';
import { DashboardMetrics } from './interfaces/dashboard-metrics.interface';
import { EmailService } from 'src/email/email.service';

interface JwtPayload {
  email: string;
  nombre?: string;
  uid: number;
}

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRol.SUPERVISOR, UserRol.SOPORTISTA, UserRol.COLABORADOR)
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly emailService: EmailService,
  ) {}

  @Get('metrics')
  async getMetrics(): Promise<DashboardMetrics> {
    return this.dashboardService.getMetrics();
  }

  @Post('send-report')
  async sendReport(@Req() req: AuthenticatedRequest) {
    const supervisorEmail = req.user.email;
    const supervisorName = req.user.nombre || 'Supervisor';

    // Obtener las métricas
    const metrics = await this.dashboardService.getMetrics();

    await this.emailService.sendDashboardReport(
      supervisorEmail,
      supervisorName,
      metrics,
    );

    return {
      message:
        'Reporte de Dashboard enviado exitosamente al correo del supervisor.',
      email: supervisorEmail,
    };
  }
}

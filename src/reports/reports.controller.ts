import { Controller, Get, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRol } from 'src/entities/rol.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('tickets-by-status')
  @Roles(UserRol.SUPERVISOR)
  async ticketsByStatus() {
    return this.reportsService.ticketsByStatus();
  }

  @Get('tickets-by-soportista')
  @Roles(UserRol.SUPERVISOR)
  async ticketsBySoportista() {
    return this.reportsService.ticketsBySoportista();
  }

  @Get('tickets-by-user')
  @Roles(UserRol.SUPERVISOR)
  async ticketsByUser() {
    return this.reportsService.ticketsByUser();
  }

  @Get('summary')
  @Roles(UserRol.SUPERVISOR)
  async summary() {
    return this.reportsService.summary();
  }
}

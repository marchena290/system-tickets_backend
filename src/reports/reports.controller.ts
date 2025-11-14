import { User } from 'src/entities/user.entity';
import { ReportsService } from './reports.service';
import { UserRol } from 'src/entities/rol.entity';
import { Controller, ForbiddenException, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // Método privado para validar SUPERVISOR
  private validarSupervisor(user: User) {
    if (user.rol.name !== UserRol.SUPERVISOR) {
      throw new ForbiddenException('Solo SUPERVISOR puede ver reportes');
    }
  }

  @Get('tickets-by-status')
  @UseGuards(JwtAuthGuard)
  async ticketsByStatus(@GetUser() user: User) {
    this.validarSupervisor(user);
    return await this.reportsService.ticketsByStatus();
  }

  @Get('tickets-by-soportista')
  @UseGuards(JwtAuthGuard)
  async ticketsBySoportista(@GetUser() user: User) {
    this.validarSupervisor(user);
    return await this.reportsService.ticketsBySoportista();
  }

  @Get('tickets-by-user')
  @UseGuards(JwtAuthGuard)
  async ticketsByUser(@GetUser() user: User) {
    this.validarSupervisor(user);
    return await this.reportsService.ticketsByUser();
  }

  @Get('summary')
  @UseGuards(JwtAuthGuard)
  async summary(@GetUser() user: User) {
    this.validarSupervisor(user);
    return await this.reportsService.summary();
  }
}

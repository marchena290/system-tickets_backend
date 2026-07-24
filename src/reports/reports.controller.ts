import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ReportsService, GroupedCountResult } from './reports.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRol } from 'src/entities/rol.entity';
import { ReportQueryDto } from './dto/report-query.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('tickets/total')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRol.SUPERVISOR)
  async total(): Promise<{ total: number }> {
    const total = await this.reportsService.getTotalTickets();
    return { total };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('tickets/summary/status')
  @Roles(UserRol.SUPERVISOR)
  async summaryByStatus(
    @Query() query: ReportQueryDto,
  ): Promise<GroupedCountResult[]> {
    return this.reportsService.getSummaryByStatus(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('tickets/summary/category')
  @Roles(UserRol.SUPERVISOR)
  async summaryByCategory(
    @Query() query: ReportQueryDto,
  ): Promise<GroupedCountResult[]> {
    return this.reportsService.getSummaryByCategory(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('tickets/by-status')
  @Roles(UserRol.SUPERVISOR)
  async ticketsByStatus(
    @Query() query: ReportQueryDto,
  ): Promise<GroupedCountResult[]> {
    return this.reportsService.getSummaryByStatus(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('tickets/by-soportista')
  @Roles(UserRol.SUPERVISOR)
  async ticketsBySoportista(@Query() query: ReportQueryDto): Promise<any[]> {
    return this.reportsService.getLoadBySoportista(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('tickets/by-user')
  @Roles(UserRol.SUPERVISOR)
  async ticketsByUser(): Promise<any[]> {
    return this.reportsService.ticketsByUser();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('tickets/list')
  @Roles(UserRol.SUPERVISOR)
  async list(@Query() query: ReportQueryDto): Promise<any[]> {
    return this.reportsService.listTickets(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('tickets/summary')
  @Roles(UserRol.SUPERVISOR)
  async summary(): Promise<any> {
    return this.reportsService.summary();
  }
}

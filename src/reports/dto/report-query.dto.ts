import { IsOptional, IsDateString } from 'class-validator';
import { TicketStatus } from 'src/entities/ticket.entity';

export class ReportQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  status?: TicketStatus;
}

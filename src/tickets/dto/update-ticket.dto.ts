import { PartialType } from '@nestjs/mapped-types';
import { CreateTicketDto } from './create-ticket.dto';
import { TicketCategory, TicketStatus } from 'src/entities/ticket.entity';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateTicketDto extends PartialType(CreateTicketDto) {
  @IsOptional()
  @IsEnum(TicketStatus, { message: 'Estado no válido' })
  estado?: TicketStatus;

  // aceptar también la variante 'status' en inglés por compatibilidad
  @IsOptional()
  @IsEnum(TicketStatus, { message: 'Status no válido' })
  status?: TicketStatus;

  // aceptar 'category' en inglés (complementa 'categoria' heredada)
  @IsOptional()
  @IsEnum(TicketCategory, { message: 'Categoria no válida' })
  category?: TicketCategory;
}

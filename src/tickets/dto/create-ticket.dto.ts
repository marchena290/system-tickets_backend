import { IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { TicketCategory, TicketType } from 'src/entities/ticket.entity';

export class CreateTicketDto {
  @IsNotEmpty({ message: 'El asunto no puede estar vacío' })
  @MinLength(5, { message: 'El asunto debe tener al menos 5 caracteres' })
  @IsString({ message: 'El asunto debe ser un texto' })
  asunto: string;

  @IsNotEmpty({ message: 'La descripcion no puede estar vacía' })
  @MinLength(10, {
    message: 'La descripcion debe tener al menos 10 caracteres',
  })
  @IsString({ message: 'La descripcion debe ser un texto' })
  descripcion: string;

  @IsEnum(TicketType, { message: 'El tipo de ticket no es válido' })
  tipo: TicketType;

  @IsEnum(TicketCategory, { message: 'La categoría de ticket no es válida' })
  categoria: TicketCategory;
}

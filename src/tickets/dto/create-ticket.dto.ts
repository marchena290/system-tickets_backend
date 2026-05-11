import {
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsBoolean,
  IsEmail,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TicketCategory, TicketType } from 'src/entities/ticket.entity';

// Requerido por el campo requester
export class RequesterDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  cedula: string;

  @IsString()
  department: string;
}

// ✅ CAMBIOS CLAVE: Nombres de campo en inglés para coincidir con el Frontend y la Base de Datos.
export class CreateTicketDto {
  // --- TÍTULO (Reemplaza 'asunto') ---
  @IsNotEmpty({ message: 'El title no puede estar vacío' })
  @MinLength(5, { message: 'El title debe tener al menos 5 caracteres' })
  @MaxLength(100, {
    message:
      'El título no debe exceder los 100 caracteres. Por favor, sé conciso.',
  })
  @IsString({ message: 'El title debe ser un texto' })
  title: string;

  // --- DESCRIPCIÓN (Reemplaza 'descripcion') ---
  @IsNotEmpty({ message: 'La description no puede estar vacía' })
  @MinLength(10, {
    message: 'La description debe tener al menos 10 caracteres',
  })
  @IsString({ message: 'La description debe ser un texto' })
  description: string;

  // --- TIPO (Reemplaza 'tipo') ---
  @IsEnum(TicketType, { message: 'El type de ticket no es válido' })
  type: TicketType;

  // --- CATEGORÍA / PRIORIDAD (Reemplaza 'categoria') ---
  @IsEnum(TicketCategory, { message: 'La category de ticket no es válida' })
  category: TicketCategory;

  @IsOptional()
  @ValidateNested()
  @Type(() => RequesterDto)
  requester?: RequesterDto;

  @IsOptional()
  @IsBoolean()
  notifyOnCreate?: boolean;

  @IsOptional()
  @IsString({ each: true })
  evidenceUrls?: string[];
}

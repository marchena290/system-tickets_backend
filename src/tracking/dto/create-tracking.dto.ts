import {
  IsNotEmpty,
  IsPositive,
  IsString,
  MinLength,
  IsInt,
} from 'class-validator';

export class CreateTrackingDto {
  @IsString({ message: 'La descripción debe ser un texto' })
  @IsNotEmpty({ message: 'La descripción no puede estar vacía' })
  @MinLength(5, { message: 'La descripción debe tener al menos 5 caracteres' })
  description: string;

  @IsNotEmpty({ message: 'El ID del ticket es obligatorio.' })
  @IsInt({ message: 'El ID del ticket debe ser un número entero' })
  @IsPositive({ message: 'El ID del ticket debe ser un número positivo' })
  ticketId: number;

  @IsNotEmpty({ message: 'El ID del usuario es obligatorio.' })
  @IsInt({ message: 'El ID del usuario debe ser un número entero' })
  @IsPositive({ message: 'El ID del usuario debe ser un número positivo' })
  usuarioId: number;
}

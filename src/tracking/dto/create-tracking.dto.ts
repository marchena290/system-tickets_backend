import { IsNotEmpty, IsPositive, IsString, MinLength } from 'class-validator';

export class CreateTrackingDto {
  @IsString({ message: 'La descripción debe ser un texto' })
  @IsNotEmpty({ message: 'La descripción no puede estar vacía' })
  @MinLength(5, { message: 'La descripción debe tener al menos 5 caracteres' })
  descripcion: string;

  @IsPositive({ message: 'El ID del ticket debe ser un número positivo' })
  ticketId: number;
}

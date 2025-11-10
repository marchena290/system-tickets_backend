import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email: string;

  @IsNotEmpty({ message: 'La contraseña no puede estar vacía' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @IsString({ message: 'La contraseña debe ser un texto' })
  password: string;

  @IsNotEmpty({ message: 'El nombre completo no puede estar vacío' })
  @IsString({ message: 'El nombre completo debe ser un texto' })
  nombreCompleto: string;

  @IsNotEmpty({ message: 'La cédula no puede estar vacía' })
  @IsString({ message: 'La cédula debe ser un texto' })
  cedula: string;

  @IsNotEmpty({ message: 'El departamento no puede estar vacío' })
  @IsString({ message: 'El departamento debe ser un texto' })
  departamento: string;

  @IsNotEmpty({ message: 'El contacto no puede estar vacío' })
  @IsString({ message: 'El contacto debe ser un texto' })
  contacto: string;

  @IsNotEmpty({ message: 'El rol no puede estar vacío' })
  @IsString({ message: 'El rol debe ser un texto' })
  rol: string;
}

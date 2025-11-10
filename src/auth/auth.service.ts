import { BadRequestException, Injectable } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Rol, UserRol } from 'src/entities/rol.entity';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>,
  ) {}

  async register(registerDto: RegisterDto): Promise<User> {
    const emailExists = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (emailExists) {
      throw new BadRequestException('El email ya está en uso');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const rolColaborador = await this.rolRepository.findOne({
      where: { name: UserRol.COLABORADOR },
    });

    if (!rolColaborador) {
      throw new BadRequestException('Rol COLABORADOR no encontrado');
    }

    const newUser = this.userRepository.create({
      email: registerDto.email,
      password: hashedPassword,
      nombreCompleto: registerDto.nombreCompleto,
      cedula: registerDto.cedula,
      departamento: registerDto.departamento,
      contacto: registerDto.contacto,
      rol: rolColaborador,
    });

    const savedUser = await this.userRepository.save(newUser);
    const { password: _, ...result } = savedUser;
    return result as User;
  }

  async login(loginDto: LoginDto): Promise<User> {
    const userExists = await this.userRepository.findOne({
      where: { email: loginDto.email },
      select: [
        'id',
        'email',
        'nombreCompleto',
        'cedula',
        'departamento',
        'contacto',
        'password',
        'isActive',
      ],
      relations: ['rol'],
    });
    if (!userExists) {
      throw new BadRequestException('Credenciales invalidas');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      userExists.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Credenciales invalidas');
    }
    const { password: _, ...result } = userExists;
    return result as User;
  }
}

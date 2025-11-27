import { BadRequestException, Injectable } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Rol, UserRol } from 'src/entities/rol.entity';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<User> {
    const emailExists = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (emailExists) {
      throw new BadRequestException('El email ya está en uso');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const rol = await this.rolRepository.findOne({
      where: { name: registerDto.rol as UserRol },
    });

    if (!rol) {
      throw new BadRequestException(`Rol ${registerDto.rol} no encontrado`);
    }

    const newUser = this.userRepository.create({
      email: registerDto.email,
      password: hashedPassword,
      nombreCompleto: registerDto.nombreCompleto,
      cedula: registerDto.cedula,
      departamento: registerDto.departamento,
      contacto: registerDto.contacto,
      rol: rol,
    });

    const savedUser = await this.userRepository.save(newUser);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = savedUser;
    return result as User;
  }

  async login(loginDto: LoginDto) {
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = userExists;
    return {
      user: result as User,
      access_token: this.generateToken(userExists),
    };
  }

  private generateToken(user: User): string {
    const payload = {
      id: user.id,
      email: user.email,
      rol: user.rol.name,
    };
    return this.jwtService.sign(payload);
  }
}

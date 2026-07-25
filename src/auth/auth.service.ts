import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Rol, UserRol } from 'src/entities/rol.entity';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private getPasswordSaltRounds(): number {
    return Number(this.configService.get<string>('BCRYPT_SALT_ROUNDS') || 12);
  }

  async register(registerDto: RegisterDto): Promise<User> {
    const emailExists = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (emailExists) {
      throw new BadRequestException('El email ya está en uso');
    }

    const hashedPassword = await bcrypt.hash(
      registerDto.password,
      this.getPasswordSaltRounds(),
    );

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
      throw new UnauthorizedException('Credenciales invalidas');
    }

    // bloquear usuarios inactivos
    if (userExists.isActive === false) {
      throw new UnauthorizedException(
        'Usuario desactivado. Contacta al administrador',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      userExists.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales invalidas');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = userExists;
    return {
      user: result as User,
      access_token: this.generateToken(userExists),
    };
  }

  private generateToken(user: User): string {
    const roleName = user.rol.name;
    const payload = {
      sub: user.id,
      rol: roleName,
      role: roleName,
      roles: [roleName],
    };
    return this.jwtService.sign(payload);
  }
}

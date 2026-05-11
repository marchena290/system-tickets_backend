import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { Rol, UserRol } from 'src/entities/rol.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>,

    // ✅ Inyección del servicio de correo
    private readonly emailService: EmailService,
  ) {}

  // -------------------------------------------------------------
  // ✅ NUEVO MÉTODO PARA CREAR CLIENTES (Solicitantes externos)
  // -------------------------------------------------------------
  async createClientUser(clientData: CreateUserDto): Promise<User> {
    // 💡 1. Desestructuramos los datos para usarlos fácilmente
    const { email, nombreCompleto, cedula, departamento, contacto } =
      clientData;

    // 2. Verificar si el usuario ya existe (seguridad extra)
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      this.logger.warn(`Intento de crear cliente duplicado: ${email}`);
      return existingUser; // Si ya existe, lo devolvemos para usarlo.
    }

    // 3. Generar Contraseña Temporal y hash
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // 4. Obtener el Rol CLIENTE
    const clienteRol = await this.rolRepository.findOne({
      where: { name: UserRol.CLIENTE },
    });
    if (!clienteRol) {
      this.logger.error('Rol CLIENTE no encontrado.');
      throw new InternalServerErrorException(
        'Error de configuración: Rol de cliente no existe.',
      );
    }

    // 5. Crear el nuevo usuario
    const newUser = this.userRepository.create({
      email: email, // Usamos el email desestructurado
      nombreCompleto: nombreCompleto, // Usamos el nombre desestructurado
      password: hashedPassword,
      rol: clienteRol,
      cedula: cedula,
      departamento: departamento,
      contacto: contacto || '',
    });

    try {
      const savedUser = await this.userRepository.save(newUser);
      this.logger.log(`Nuevo usuario cliente creado: ${email}`);

      // 6. Notificar credenciales por correo
      await this.emailService.enviarCredencialesCliente(email, tempPassword);

      // Limpiar la contraseña antes de devolver.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-unsafe-assignment
      const { password: _, ...result } = savedUser as any;
      return result as User;
    } catch (error) {
      this.logger.error(`Fallo al crear usuario cliente ${email}:`, error);
      throw new InternalServerErrorException(
        'No se pudo guardar el nuevo usuario cliente.',
      );
    }
  }
  // -------------------------------------------------------------
  // ✅ MÉTODOS EXISTENTES DEL CRUD
  // -------------------------------------------------------------

  async findAll(): Promise<User[]> {
    return this.userRepository.find({ relations: ['rol'] });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['rol'],
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async create(dto: CreateUserDto): Promise<User> {
    const rol = await this.rolRepository.findOne({
      where: { name: dto.rol as UserRol },
    });
    if (!rol) throw new NotFoundException(`Rol ${dto.rol} not found`);
    const hashed = await bcrypt.hash(dto.password, 10);

    const newUser = this.userRepository.create({
      email: dto.email,
      password: hashed,
      nombreCompleto: dto.nombreCompleto,
      cedula: dto.cedula,
      departamento: dto.departamento,
      contacto: dto.contacto,
      rol: rol,
    });

    const saved = await this.userRepository.save(newUser);
    // remove password before returning
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-unsafe-assignment
    const { password: _, ...result } = saved as any;
    return result as User;
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['rol'],
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);

    if (dto.password) {
      user.password = await bcrypt.hash(dto.password, 10);
    }
    if (dto.email) user.email = dto.email;
    if (dto.nombreCompleto) user.nombreCompleto = dto.nombreCompleto;
    if (dto.cedula) user.cedula = dto.cedula;
    if (dto.departamento) user.departamento = dto.departamento;
    if (dto.contacto) user.contacto = dto.contacto;
    if (dto.rol) {
      const rol = await this.rolRepository.findOne({
        where: { name: dto.rol as UserRol },
      });
      if (rol) user.rol = rol;
    }

    const saved = await this.userRepository.save(user);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-unsafe-assignment
    const { password: _, ...result } = saved as any;
    return result as User;
  }

  async remove(id: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    if (user.isActive) {
      this.logger.warn(`Intento de eliminar usuario activo: ${user.email}`);
      throw new ForbiddenException(
        `No se puede eliminar al usuario ${id} mientras esté activo. Considere usar la desactivación lógica.`,
      );
    }
    await this.userRepository.remove(user);
  }

  /** Deshabilitación lógica de un usuario (baja lógica) */
  async deactivateUser(id: number, actingUser: User): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['rol'],
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);

    if (user.id === actingUser.id) {
      throw new ForbiddenException('No puedes desactivarte a ti mismo');
    }

    user.isActive = false;
    const saved = await this.userRepository.save(user);
    // remove password before returning
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-unsafe-assignment
    const { password: _, ...result } = saved as any;
    return result as User;
  }

  /** Reactivación de un usuario desactivado */
  async reactivateUser(id: number, actingUser: User): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['rol'],
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);

    if (user.isActive) {
      throw new ForbiddenException('El usuario ya está activo');
    }

    user.isActive = true;
    const saved = await this.userRepository.save(user);

    this.logger.log(`Usuario ${user.email} reactivado por ${actingUser.email}`);

    // remove password before returning
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-unsafe-assignment
    const { password: _, ...result } = saved as any;
    return result as User;
  }

  async findAllSoportistas(): Promise<User[]> {
    return this.userRepository.find({
      where: { rol: { name: UserRol.SOPORTISTA } },
      relations: ['rol'],
    });
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { Rol, UserRol } from 'src/entities/rol.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>,
  ) {}

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
    if (!user) throw new NotFoundException(`User ${id} not found`);
    await this.userRepository.remove(user);
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Rol, UserRol } from '../entities/rol.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>,
  ) {}

  async seedRoles() {
    const rolesCount = await this.rolRepository.count();

    if (rolesCount > 0) {
      return;
    }

    const roles = [
      this.rolRepository.create({ name: UserRol.COLABORADOR }),
      this.rolRepository.create({ name: UserRol.SOPORTISTA }),
      this.rolRepository.create({ name: UserRol.SUPERVISOR }),
    ];

    await this.rolRepository.save(roles);
  }
}

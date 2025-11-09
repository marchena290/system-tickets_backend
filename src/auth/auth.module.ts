import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SeedService } from './seed.service';
import { User } from '../entities/user.entity';
import { Rol } from '../entities/rol.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Rol])],
  controllers: [AuthController],
  providers: [AuthService, SeedService],
  exports: [AuthService, SeedService],
})
export class AuthModule {}

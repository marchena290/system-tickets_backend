import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SeedService } from './seed.service';
import { User } from '../entities/user.entity';
import { Rol } from '../entities/rol.entity';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Rol]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'tu-secreto-super-seguro',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, SeedService, JwtStrategy],
  exports: [AuthService, SeedService],
})
export class AuthModule {}

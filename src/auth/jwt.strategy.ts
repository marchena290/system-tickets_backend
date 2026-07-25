import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: number; rol?: string; role?: string }) {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      relations: ['rol'],
    });

    if (!user || user.isActive === false) {
      throw new UnauthorizedException('Token no válido');
    }

    const tokenRoleRaw = payload.rol ?? payload.role;

    // Validación segura y flexible libre de errores de ESLint
    if (tokenRoleRaw) {
      const dbRoleName = String(user.rol?.name ?? '')
        .toUpperCase()
        .trim();
      const tokenRoleName = String(tokenRoleRaw).toUpperCase().trim();

      if (dbRoleName !== tokenRoleName) {
        throw new UnauthorizedException('Token no válido');
      }
    }

    return user;
  }
}

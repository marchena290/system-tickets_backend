import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { Request } from 'express';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1) Obtener metadata (NOTA: el segundo argumento debe ser un ARRAY)
    const requiredRoles =
      this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    // 2) Si no hay roles requeridos, permitir acceso
    if (requiredRoles.length === 0) return true;

    // 3) Extraer request y user (JwtAuthGuard debe haber poblado request.user)
    const req = context.switchToHttp().getRequest<Request & { user?: any }>();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const user = req.user;
    if (!user) {
      throw new ForbiddenException(
        'Usuario no autenticado (request.user undefined)',
      );
    }

    // 4) Normalizar rol(es) del usuario (tolerante a varias formas)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const userRoleFromName = user?.rol
      ? // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (user.rol.name ?? user.rol)
      : null;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const userRoleDirect = user?.role ?? null;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const userRolesArray = Array.isArray(user?.roles) ? user.roles : null;

    let rolesToCheck: string[] = [];
    if (userRolesArray) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      rolesToCheck = userRolesArray.map((r) => String(r).toUpperCase());
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const candidate = userRoleFromName ?? userRoleDirect ?? '';
      rolesToCheck = candidate ? [String(candidate).toUpperCase()] : [];
    }

    // 5) Comparación case-insensitive (metadata -> may be enum)
    const requiredUpper = requiredRoles.map((r) => String(r).toUpperCase());

    const allowed = rolesToCheck.some((r) => requiredUpper.includes(r));
    if (!allowed) {
      throw new ForbiddenException(
        'No tienes permisos para acceder a este recurso',
      );
    }

    return true;
  }
}

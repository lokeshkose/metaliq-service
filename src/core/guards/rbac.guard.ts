import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PERMISSIONS_KEY } from '../decorators/permission.decorator';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    /* ======================================================
     * 1. PUBLIC ROUTES
     * ====================================================== */
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    /* ======================================================
     * 2. REQUIRED PERMISSIONS
     * ====================================================== */
    const requiredPermissions =
      this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || [];

    if (requiredPermissions.length === 0) return true;

    /* ======================================================
     * 3. USER FROM REQUEST (JWT → REDIS)
     * ====================================================== */
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user?.userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    /* ======================================================
     * 4. SESSION VALIDATION
     * ====================================================== */
    if (!Array.isArray(user.permissions)) {
      throw new UnauthorizedException('Invalid session');
    }

    /* ======================================================
     * 5. USER / ROLE STATUS CHECK
     * ====================================================== */
    if (user.isActive === false) {
      throw new ForbiddenException('Employee account is inactive');
    }

    if (user.roleStatus === false) {
      throw new ForbiddenException('Role is inactive');
    }

    /* ======================================================
     * 6. SUPER ADMIN BYPASS
     * ====================================================== */
    if (user.roleName === 'SUPER_ADMIN') {
      return true;
    }

    /* ======================================================
     * 7. PERMISSION CHECK
     * ====================================================== */
    const userPermissions = new Set<string>(user.permissions);

    const hasAllPermissions = requiredPermissions.every((p) => userPermissions.has(p));

    if (!hasAllPermissions) {
      throw new ForbiddenException('You do not have permission to access this resource');
    }

    return true;
  }
}

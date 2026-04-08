import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  /* ======================================================
   * MAIN GUARD
   * ====================================================== */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    /* ---------- PUBLIC ROUTE ---------- */
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    /* ---------- DEVICE VALIDATION (EARLY FAIL) ---------- */
    const deviceIdHeader = request.headers['x-device-id'];

    const deviceId =
      typeof deviceIdHeader === 'string'
        ? deviceIdHeader
        : Array.isArray(deviceIdHeader)
          ? deviceIdHeader[0]
          : null;

    if (!deviceId) {
      throw new UnauthorizedException('Device ID missing');
    }

    request.deviceId = deviceId; // attach early

    /* ---------- JWT VALIDATION ---------- */
    const isActivated = (await super.canActivate(context)) as boolean;

    if (!isActivated) {
      throw new UnauthorizedException('Unauthorized');
    }

    return true;
  }

  /* ======================================================
   * HANDLE REQUEST (AFTER STRATEGY)
   * ====================================================== */
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      throw err || new UnauthorizedException(info?.message || 'Unauthorized');
    }

    const request = context.switchToHttp().getRequest();

    /* ---------- FINAL DEVICE MATCH ---------- */
    if (user.deviceId !== request.deviceId) {
      throw new UnauthorizedException('Device mismatch');
    }

    return user;
  }
}

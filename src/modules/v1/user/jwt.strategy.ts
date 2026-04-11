import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

import { jwtConfig } from '../../../core/config/jwt.config';
import { jwtExtractor } from '../../../core/auth/jwt-extractor';
import { RedisRepository } from 'src/core/database/radis/radis.repository';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly redis: RedisRepository,
  ) {
    const secret = config.get<string>('JWT_SECRET');

    if (!secret) {
      throw new Error('JWT_SECRET missing');
    }

    super({
      jwtFromRequest: jwtExtractor,
      secretOrKey: secret,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    });
  }

  async validate(payload: any) {
    /* ======================================================
     * BASIC VALIDATION
     * ====================================================== */
    if (!payload?.sub || !payload?.sid || !payload?.did) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const userId = payload.sub;
    const sessionId = payload.sid;
    const deviceId = payload.did;

    /* ======================================================
     * FETCH SESSION (USING HELPER)
     * ====================================================== */
    const session = await this.redis.getSession<any>(sessionId);

    if (!session) {
      throw new UnauthorizedException('Session expired');
    }

    /* ======================================================
     * 🔐 SINGLE DEVICE VALIDATION (CRITICAL)
     * ====================================================== */
    const activeSession = await this.redis.getUserSession<any>(userId);

    if (!activeSession || activeSession.deviceId !== deviceId) {
      throw new UnauthorizedException('Logged in from another device or session invalid');
    }

    /* ======================================================
     * SECURITY CHECKS
     * ====================================================== */

    if (session.deviceId !== deviceId) {
      throw new UnauthorizedException('Device mismatch');
    }

    if (session.userId !== userId) {
      throw new UnauthorizedException('Token mismatch');
    }

    if (!session.isActive) {
      throw new UnauthorizedException('Session inactive');
    }

    /* ======================================================
     * RETURN USER
     * ====================================================== */
    return {
      userId: session.userId,
      profileId: session.profileId,

      name: session.name,
      email: session.email,
      mobile: session.mobile,

      role: session.role,
      roleName: session.roleName,
      permissions: session.permissions,

      userType: session.userType,
      isActive: session.isActive,
      roleStatus: session.roleStatus,

      deviceId: session.deviceId,
      sessionId,
    };
  }
}

import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession } from 'mongoose';

import { LoginDto } from './dto/login.dto';
import { RedisRepository } from 'src/core/database/radis/radis.repository';

import { User, UserSchema } from 'src/core/database/mongo/schema/user.schema';
import { Employee, EmployeeSchema } from 'src/core/database/mongo/schema/employee.schema';
import { Customer, CustomerSchema } from 'src/core/database/mongo/schema/customer.schema';

import { MongoService } from 'src/core/database/mongo/mongo.service';
import { MongoRepository } from 'src/core/database/mongo/mongo.repository';

import { USER } from './user.constants';
import { jwtConfig } from 'src/core/config/jwt.config';

import { DeviceService } from '../device/device.service';
import { RoleService } from '../role/role.service';

import { Session, Status, Token } from 'src/shared/enums/app.enums';
import { DeviceStatus } from 'src/shared/enums/device.enums';
import { UserStatus } from 'src/shared/enums/user.enums';
import { CreateUserDto } from './dto/create-user.dto';
import { IdGenerator } from 'src/shared/utils/id-generator.utils';
import { MailService } from 'src/core/mail/mail.service';

@Injectable()
export class UserService extends MongoRepository<User> {
  constructor(
    private readonly jwtService: JwtService,
    private readonly redis: RedisRepository,
    private readonly deviceService: DeviceService,
    private readonly roleService: RoleService,
    private readonly mailService: MailService,

    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Employee.name) private employeeModel: Model<Employee>,
    @InjectModel(Customer.name) private customerModel: Model<Customer>,

    mongo: MongoService,
  ) {
    super(mongo.getModel(User.name, UserSchema));
  }

  /* ======================================================
   * CREATE USER
   * ====================================================== */
  async createUser(data: CreateUserDto, session?: ClientSession) {
    try {
      const hashedPassword = await bcrypt.hash(data.password, 10);

      const user = await this.save(
        {
          profileId: data.profileId,
          mobile: data.mobile,
          email: data.email?.toLowerCase(),
          password: hashedPassword,
          status: UserStatus.ACTIVE,
          loginId: data.loginId,
          userType: data.userType,
          userId: IdGenerator.generate('UID', 8),
        },
        { session },
      );

      return {
        profileId: user.profileId,
        mobile: user.mobile,
        email: user.email,
      };
    } catch (err: any) {
      if (err?.code === 11000) {
        throw new ForbiddenException(USER.DUPLICATE);
      }
      throw err;
    }
  }

  /* ======================================================
   * RESOLVE PROFILE (NO SERVICE DEPENDENCY 🔥)
   * ====================================================== */
  private async resolveProfile(user: any) {
    switch (user.userType) {
      case 'EMPLOYEE':
        return this.employeeModel.findOne({ employeeId: user.profileId }).lean();

      case 'CUSTOMER':
        return this.customerModel.findOne({ customerId: user.profileId }).lean();

      default:
        return null;
    }
  }

  async login(body: LoginDto, sessionId: string, deviceId: string, ipAddress?: string) {
    const { loginId, password, deviceInfo, forceLogin } = body;

    if (!deviceInfo) {
      throw new BadRequestException('Device info missing');
    }

    const user: any = await this.findOneWithSelect({ loginId }, '+password');

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException(USER.INVALID_CREDENTIALS);
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new UnauthorizedException(USER.INVALID_CREDENTIALS);
    }

    const profile: any = await this.resolveProfile(user);
    if (!profile) {
      throw new ForbiddenException(USER.PROFILE_NOT_FOUND);
    }

    /* ---------- ROLE ---------- */
    const role = {
      roleId: 'TEST123',
      name: 'TEMP',
      status: Status.ACTIVE,
      permissions: [],
    };

    if (!role) throw new ForbiddenException('Role not found');
    if (role.status !== Status.ACTIVE) throw new ForbiddenException('Role inactive');

    /* ======================================================
     * 🚨 SINGLE DEVICE CHECK (USING HELPER)
     * ====================================================== */

    const existingSession: any = await this.redis.getUserSession(user.userId);

    if (existingSession) {
      const {
        sessionId: oldSessionId,
        deviceId: oldDeviceId,
        deviceName,
        platform,
        lastLoginAt,
      } = existingSession;

      if (oldDeviceId !== deviceId) {
        if (!forceLogin) {
          throw new ForbiddenException({
            code: 'ALREADY_LOGGED_IN',
            message:
              'You are already logged in on another device. Do you want to logout from that device?',
            device: {
              deviceId: oldDeviceId,
              deviceName,
              platform,
              lastLoginAt,
            },
          });
        }

        /* ---------- FORCE LOGIN ---------- */
        await this.redis.deleteSession(oldSessionId);

        await this.deviceService.update(
          { userId: user.userId, deviceId: oldDeviceId },
          { status: DeviceStatus.INACTIVE },
        );
      }
    }

    /* ---------- DEVICE ---------- */
    await this.deviceService.update(
      { userId: user.userId, deviceId },
      {
        profileId: user.profileId,
        userId: user.userId,
        ...deviceInfo,
        ipAddress,
        sessionId,
        lastLoginAt: new Date(),
        status: DeviceStatus.ACTIVE,
      },
      { upsert: true },
    );

    /* ---------- PERMISSIONS ---------- */
    const permissions = new Set<string>(role.permissions || []);

    for (const p of profile.permissionOverrides?.allow || []) {
      permissions.add(p);
    }

    for (const p of profile.permissionOverrides?.deny || []) {
      permissions.delete(p);
    }

    /* ---------- SESSION ---------- */
    const sessionData = {
      type: user.userType,
      userId: user.userId,
      profileId: user.profileId,

      role: role.roleId,
      roleName: role.name,
      permissions: Array.from(permissions),

      userType: user.userType,
      name: profile?.name,
      email: user.email,
      mobile: user.mobile,

      isActive: true,
      roleStatus: role.status === Status.ACTIVE,

      deviceId,
      createdAt: new Date().toISOString(),
    };

    await this.redis.setSession(sessionId, sessionData, Session.EXPIRED_IN_MS);

    /* ---------- SAVE ACTIVE SESSION ---------- */
    await this.redis.setUserSession(
      user.userId,
      {
        sessionId,
        deviceId,
        deviceName: deviceInfo?.deviceType || 'Unknown Device',
        platform: deviceInfo?.os || 'Unknown',
        lastLoginAt: new Date().toISOString(),
      },
      Session.EXPIRED_IN_MS,
    );

    /* ---------- REFRESH TOKEN ---------- */
    const refreshToken = randomUUID();

    await this.redis.setRefreshToken(
      sessionId,
      {
        hash: await bcrypt.hash(refreshToken, 10),
        deviceId,
      },
      Session.EXPIRED_IN_MS,
    );

    /* ---------- ACCESS TOKEN ---------- */
    const payload = {
      sub: user.userId,
      sid: sessionId,
      did: deviceId,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: Token.EXPIRED_IN,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: Token.EXPIRED_IN,
      expiresInMs: Token.EXPIRED_IN_MS,
      sessionId,
      user: {
        profileId: user.profileId,
        profile,
        userType: user?.userType,
        userId: user?.userId,
      },
      message: USER.LOGIN,
    };
  }

  /* ======================================================
   * REFRESH
   * ====================================================== */
  async refresh(sessionId: string, refreshToken: string, deviceId: string) {
    const stored = await this.redis.getJson<any>(`refresh:${sessionId}`);

    if (!stored || stored.deviceId !== deviceId) {
      throw new UnauthorizedException(USER.INVALID_REFRESH_TOKEN);
    }

    const valid = await bcrypt.compare(refreshToken, stored.hash);
    if (!valid) {
      throw new UnauthorizedException(USER.INVALID_REFRESH_TOKEN);
    }

    const session = await this.redis.getJson<any>(`session:${sessionId}`);
    if (!session) {
      throw new UnauthorizedException(USER.SESSION_EXPIRED);
    }

    await this.deviceService.update(
      { userId: session.userId, deviceId },
      { lastLoginAt: new Date() },
    );

    const payload = {
      sub: session.userId,
      sid: sessionId,
      did: deviceId,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: Token.EXPIRED_IN,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    });

    return {
      accessToken,
      expiresIn: Token.EXPIRED_IN,
      expiresInMs: Token.EXPIRED_IN_MS,
      message: USER.TOKEN_REFRESHED,
      statusCode: HttpStatus.OK,
    };
  }

  async logout(req: any, res: Response, deviceId: string) {
    const sessionId = req.sessionId;
    const userId = req.user?.userId;

    if (!sessionId || !userId) {
      throw new UnauthorizedException(USER.SESSION_EXPIRED);
    }

    await Promise.all([
      this.redis.deleteSession(sessionId),
      this.redis.deleteUserSession(userId),
      this.deviceService.update({ userId, deviceId }, { status: DeviceStatus.INACTIVE }),
    ]);

    /* ---------- CLEAR COOKIES ---------- */
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    res.clearCookie('sessionId');

    return {
      statusCode: HttpStatus.OK, // ✅ add this (important for interceptor)
      message: USER.LOGOUT,
    };
  }

  async logoutByProfileId(profileId: string, mongoSession: ClientSession) {
    /* ======================================================
     * 🔍 GET ACTIVE SESSION
     * ====================================================== */
    const user = await this.findOne({
      profileId,
    });
    const userId: any = user?.userId;
    const session: any = await this.redis.getUserSession(userId);

    if (!session) return;

    /* ======================================================
     * 🔥 DELETE SESSION + MAPPING
     * ====================================================== */
    await Promise.all([
      this.redis.deleteSession(session.sessionId),
      this.redis.deleteUserSession(userId),
    ]);

    /* ======================================================
     * 📱 OPTIONAL: MARK DEVICE INACTIVE
     * ====================================================== */
    if (session.deviceId) {
      await this.deviceService.update(
        { userId, deviceId: session.deviceId },
        { status: DeviceStatus.INACTIVE },
        { session: mongoSession },
      );
    }

    return {
      message: USER.LOGOUT,
    };
  }

  /* ======================================================
   * DELETE
   * ====================================================== */
  async delete(profileId: string, options?: any) {
    const user = await this.softDelete({ profileId }, options);

    if (!user) {
      throw new NotFoundException(USER.NOT_FOUND);
    }

    return {
      statusCode: HttpStatus.OK,
      message: USER.DELETED,
      data: user,
    };
  }

  /* ======================================================
   * RESTORE
   * ====================================================== */
  async restoreUser(data: any, session: ClientSession) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    await this.updateOne(
      { profileId: data.profileId },
      {
        password: hashedPassword,
        email: data.email,
        isDeleted: false,
        status: UserStatus.ACTIVE,
      },
      { session },
    );
  }

  async forgotPassword(userId: string) {
    /* ======================================================
     * GET USER
     * ====================================================== */
    const user: any = await this.findOne({ userId });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    /* ======================================================
     * GET PROFILE
     * ====================================================== */
    let profile: any;

    switch (user.userType) {
      case 'EMPLOYEE':
        profile = await this.employeeModel
          .findOne({ employeeId: user.profileId, isDeleted: false })
          .lean();
        break;

      case 'CUSTOMER':
        profile = await this.customerModel
          .findOne({ customerId: user.profileId, isDeleted: false })
          .lean();
        break;

      default:
        profile = null;
    }

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    if (!profile.email) {
      throw new BadRequestException('Email not found for this user');
    }

    /* ======================================================
     * 🔐 REMOVE OLD RESET TOKENS (IMPORTANT)
     * ====================================================== */
    // optional cleanup (if you track multiple tokens)
    // await this.redis.delete(`reset_user:${user.userId}`);

    /* ======================================================
     * GENERATE TOKEN
     * ====================================================== */
    const token = randomUUID();

    /* ======================================================
     * STORE TOKEN IN REDIS (TTL IN SECONDS)
     * ====================================================== */
    const TTL_SECONDS = 10 * 60; // ✅ FIXED (10 minutes)

    await this.redis.setJson(
      `reset:${token}`,
      {
        userId: user.userId,
      },
      TTL_SECONDS,
    );

    /* ======================================================
     * CREATE RESET LINK
     * ====================================================== */
    const link = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    /* ======================================================
     * SEND EMAIL
     * ====================================================== */
    await this.mailService.sendMail({
      to: profile.email,
      subject: 'Reset Password',
      html: `
      <h3>Reset Your Password</h3>
      <p>Hello ${profile.name || 'User'},</p>
      <p>Click the link below to reset your password:</p>
      <a href="${link}">${link}</a>
      <p>This link will expire in <b>10 minutes</b>.</p>
      <p>If you did not request this, please ignore this email.</p>
    `,
    });

    return {
      message: 'Reset link sent to registered email',
    };
  }

  async resetPassword(token: string, password: string) {
    /* ---------- GET RESET TOKEN DATA ---------- */
    const data = await this.redis.getJson<any>(`reset:${token}`);

    if (!data) {
      throw new BadRequestException('Invalid or expired link');
    }

    /* ---------- HASH PASSWORD ---------- */
    const hashedPassword = await bcrypt.hash(password, 10);

    /* ---------- UPDATE USER ---------- */
    const updated = await this.updateOne({ userId: data.userId }, { password: hashedPassword });

    if (!updated) {
      throw new NotFoundException('User not found');
    }

    /* ======================================================
     * 🔥 SECURITY: LOGOUT ACTIVE SESSION (IMPORTANT)
     * ====================================================== */

    const existingSession: any = await this.redis.getUserSession(data.userId);

    if (existingSession) {
      await this.redis.deleteSession(existingSession.sessionId);
      await this.redis.deleteUserSession(data.userId);
    }

    /* ---------- DELETE RESET TOKEN ---------- */
    await this.redis.delete(`reset:${token}`);

    return {
      message: USER.PASSWORD_RESET,
    };
  }
}

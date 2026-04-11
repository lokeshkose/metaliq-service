/**
 * User Controller
 */

import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiCookieAuth, ApiHeader } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { UserService } from './user.service';
import { LoginDto } from './dto/login.dto';

import { ApiSuccessResponse } from 'src/core/swagger/api.response.swagger';
import {
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
  ApiInternalErrorResponse,
} from 'src/core/swagger/api-error.response.swagger';

import { FeatureFlag } from 'src/core/decorators/feature-flag.decorator';
import { Public } from 'src/core/decorators/public.decorator';
import { API_MODULE, API_MODULE_ENABLE_KEYS, V1 } from 'src/shared/constants/api.constants';

@ApiTags('User')
@FeatureFlag(API_MODULE_ENABLE_KEYS.USER)
@ApiUnprocessableEntityResponse()
@ApiInternalErrorResponse()
@ApiUnauthorizedResponse()
@Controller({
  path: API_MODULE.USER,
  version: V1,
})
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * LOGIN
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login using loginId & password' })
  @ApiBody({ type: LoginDto })
  @ApiSuccessResponse(
    {
      success: true,
      statusCode: 200,
      message: 'Login successful',
      data: {
        accessToken: 'jwt.token.here',
        refreshToken: 'uuid',
        expiresIn: '15m',
        expiresInMs: 900000,
        sessionId: 'uuid',
        user: {
          userId: 'UID-001',
          profileId: 'EMPL-001',
          userType: 'EMPLOYEE',
          profile: {
            name: 'John Doe',
            email: 'john@mail.com',
          },
        },
      },
    },
    'Login successful',
  )
  @ApiCookieAuth('access_token')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier',
    required: true,
  })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const sessionId = (req as any).sessionId;
    if (!sessionId) throw new BadRequestException('Session ID missing');

    const deviceId = req.headers['x-device-id'] as string;
    if (!deviceId) throw new BadRequestException('Device ID missing');

    if (dto.deviceInfo.deviceId !== deviceId) {
      throw new BadRequestException('Device ID mismatch');
    }

    const result = await this.userService.login(dto, sessionId, deviceId, req.ip);

    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    return result;
  }

  /**
   * FORGOT PASSWORD
   */
  @Post('forgot-password')
  @ApiOperation({ summary: 'Send reset password link' })
  @ApiSuccessResponse(
    {
      success: true,
      statusCode: 200,
      message: 'Reset link sent to registered email',
    },
    'Reset link sent',
  )
  async forgotPassword(@Body('userId') userId: string) {
    return this.userService.forgotPassword(userId);
  }

  /**
   * RESET PASSWORD
   */
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using token' })
  @ApiSuccessResponse(
    {
      success: true,
      statusCode: 200,
      message: 'Password reset successful',
    },
    'Password reset successful',
  )
  async resetPassword(@Body('token') token: string, @Body('password') password: string) {
    return this.userService.resetPassword(token, password);
  }

  /**
   * REFRESH TOKEN
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiHeader({
    name: 'x-device-id',
    required: true,
  })
  @ApiSuccessResponse(
    {
      success: true,
      statusCode: 200,
      message: 'Token refreshed',
      data: {
        accessToken: 'new.jwt.token',
        expiresIn: '15m',
        expiresInMs: 900000,
      },
    },
    'Token refreshed',
  )
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const sessionId = (req as any).sessionId;
    if (!sessionId) throw new BadRequestException('Session ID missing');

    const deviceId = req.headers['x-device-id'] as string;
    if (!deviceId) throw new BadRequestException('Device ID missing');

    const refreshToken = req.cookies?.refresh_token || (req.headers['x-refresh-token'] as string);

    if (!refreshToken) {
      throw new BadRequestException('Refresh token missing');
    }

    const result = await this.userService.refresh(sessionId, refreshToken, deviceId);

    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return result;
  }

  /**
   * LOGOUT
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  @ApiHeader({
    name: 'x-device-id',
    required: true,
  })
  @ApiSuccessResponse(
    {
      success: true,
      statusCode: 200,
      message: 'Logout successful',
    },
    'Logout successful',
  )
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const deviceId = req.headers['x-device-id'] as string;
    if (!deviceId) throw new BadRequestException('Device ID missing');

    return this.userService.logout(req, res, deviceId);
  }
}

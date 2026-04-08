import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { DeviceStatus } from 'src/shared/enums/device.enums';

export class UpdateDeviceDto {
  /**
   * UpdateDeviceDto
   * =================
   * Data Transfer Object for updating Device records
   *
   * All fields are optional for partial updates
   * Supports partial updates - omitted fields will retain their existing values
   */
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  profileId?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  deviceType?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  os?: string;

  /**
   * Browser
   * -------
   * Server-generated session identifier
   */
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  browser?: string;

  /**
   * IpAddress
   * ---------
   * Stable client device identifier
   */
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({ enum: DeviceStatus, default: DeviceStatus.ACTIVE })
  @IsOptional()
  @IsEnum(DeviceStatus)
  status?: DeviceStatus;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  fcmToken?: string;

  @ApiPropertyOptional({ type: Date })
  @IsOptional()
  lastLoginAt?: Date;
}

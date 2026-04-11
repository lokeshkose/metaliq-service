import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { DeviceStatus } from 'src/shared/enums/device.enums';

export class CreateDeviceDto {
  /**
   * CreateDeviceDto
   * =================
   * Data Transfer Object for creating new Device records
   */
  @ApiProperty({ type: String, description: 'Business identifier for profile', required: true })
  @IsNotEmpty()
  @IsString()
  profileId!: string;

  @ApiProperty({ type: String, description: 'Business identifier for user', required: true })
  @IsNotEmpty()
  @IsString()
  userId!: string;

  @ApiProperty({ type: String, description: 'Business identifier for session', required: true })
  @IsNotEmpty()
  @IsString()
  sessionId!: string;

  @ApiProperty({ type: String, description: 'Business identifier for device', required: true })
  @IsNotEmpty()
  @IsString()
  deviceId!: string;

  @ApiProperty({ type: String, default: null })
  @IsNotEmpty()
  @IsString()
  deviceType!: string;

  @ApiProperty({ type: String, default: null })
  @IsNotEmpty()
  @IsString()
  os!: string;

  /**
   * Browser
   * -------
   * Server-generated session identifier
   */
  @ApiProperty({ type: String, default: null })
  @IsNotEmpty()
  @IsString()
  browser!: string;

  /**
   * IpAddress
   * ---------
   * Stable client device identifier
   */
  @ApiProperty({ type: String, default: null })
  @IsNotEmpty()
  @IsString()
  ipAddress!: string;

  @ApiPropertyOptional({
    enum: DeviceStatus,
    example: DeviceStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(DeviceStatus)
  status?: DeviceStatus;

  @ApiPropertyOptional({ type: String, default: null })
  @IsOptional()
  @IsString()
  fcmToken?: string;

  @ApiProperty({ type: Date })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  lastLoginAt!: Date;
}

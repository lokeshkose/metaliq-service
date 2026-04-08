import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { DeviceStatus } from 'src/shared/enums/device.enums';

export class CreateDeviceDto {
  /**
   * CreateDeviceDto
   * =================
   * Data Transfer Object for creating new Device records
   */
  @ApiProperty({ type: String, description: 'Business identifier for profile' })
  @IsNotEmpty()
  @IsString()
  profileId!: string;

  @ApiProperty({ type: String, description: 'Business identifier for user' })
  @IsNotEmpty()
  @IsString()
  userId!: string;

  @ApiProperty({ type: String, description: 'Business identifier for session' })
  @IsNotEmpty()
  @IsString()
  sessionId!: string;

  @ApiProperty({ type: String, description: 'Business identifier for device' })
  @IsNotEmpty()
  @IsString()
  deviceId!: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  deviceType!: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  os!: string;

  /**
   * Browser
   * -------
   * Server-generated session identifier
   */
  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  browser!: string;

  /**
   * IpAddress
   * ---------
   * Stable client device identifier
   */
  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  ipAddress!: string;

  @ApiPropertyOptional({
    enum: DeviceStatus,
    example: DeviceStatus.ACTIVE,
    default: DeviceStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(DeviceStatus)
  status?: DeviceStatus;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  fcmToken?: string;
}

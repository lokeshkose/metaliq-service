import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PaginationDto } from 'src/shared/dto/pagination.dto';
import { DeviceStatus } from 'src/shared/enums/device.enums';

/**
 * DeviceQueryDto
 * =================
 * Data Transfer Object for querying Device records
 *
 * All fields are optional - supports partial matching and range queries
 * Extends PaginationDto for pagination support
 */
export class DeviceQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Search by name, code, or identifier (supports partial matching)',
    example: 'search term',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  searchText?: string;

  @ApiPropertyOptional({ type: String, description: 'Filter by profile ID' })
  @IsOptional()
  @IsString()
  profileId?: string;

  @ApiPropertyOptional({ type: String, description: 'Filter by user ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ type: String, description: 'Filter by session ID' })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({ type: String, description: 'Filter by device ID' })
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

  /**
   * Status
   * ------
   * Filter by record status (e.g., ACTIVE, INACTIVE, PENDING, DELETED)
   */
  @ApiPropertyOptional({ description: 'Filter by status', example: 'ACTIVE' })
  @IsOptional()
  status?: DeviceStatus;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  fcmToken?: string;
}

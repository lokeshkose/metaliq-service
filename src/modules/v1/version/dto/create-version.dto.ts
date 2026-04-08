import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { Platform } from 'src/shared/enums/app.enums';
import { VersionStatus } from 'src/shared/enums/version.enums';

export class CreateVersionDto {
  /**
   * CreateVersionDto
   * =================
   * DTO for creating Version
   */
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  versionNumber?: string;

  @ApiPropertyOptional({ enum: Platform, enumName: 'Platform' })
  @IsOptional()
  @IsEnum(Platform)
  platform?: Platform;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  whatsNew?: string;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  forceUpdate?: boolean;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  minSupportedVersion?: string;

  @ApiPropertyOptional({ enum: VersionStatus, enumName: 'VersionStatus' })
  @IsOptional()
  @IsEnum(VersionStatus)
  status?: VersionStatus;
}

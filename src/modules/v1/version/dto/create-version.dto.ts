import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
  Matches,
  IsDateString,
} from 'class-validator';
import { Platform } from 'src/shared/enums/app.enums';
import { VersionStatus } from 'src/shared/enums/version.enums';

export class CreateVersionDto {
  /**
   * CreateVersionDto
   * =================
   * DTO for creating Version
   */

  @ApiProperty({ example: '1.2.0' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d+\.\d+\.\d+$/, {
    message: 'versionNumber must be in format x.y.z',
  })
  versionNumber!: string;

  @ApiProperty({ enum: Platform })
  @IsNotEmpty()
  @IsEnum(Platform)
  platform!: Platform;

  /* ======================================================
   * RELEASE NOTES
   * ====================================================== */

  @ApiPropertyOptional({ example: 'New UI improvements' })
  @IsOptional()
  @IsString()
  features?: string;

  @ApiPropertyOptional({ example: 'Bug fixes and performance improvements' })
  @IsOptional()
  @IsString()
  bugFixes?: string;

  /* ======================================================
   * UPDATE CONTROL
   * ====================================================== */

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  forceUpdate?: boolean;

  @ApiPropertyOptional({ example: '1.0.0' })
  @IsOptional()
  @IsString()
  minSupportedVersion?: string;

  /* ======================================================
   * OPTIONAL METADATA
   * ====================================================== */

  @ApiPropertyOptional({ example: '100' })
  @IsOptional()
  @IsString()
  buildNumber?: string;

  @ApiPropertyOptional({
    example: 'https://play.google.com/store/apps/details?id=com.app',
  })
  @IsOptional()
  @IsString()
  downloadUrl?: string;

  @ApiPropertyOptional({ example: '2026-04-11T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  releaseDate?: Date;

  /* ======================================================
   * STATUS
   * ====================================================== */

  @ApiPropertyOptional({ enum: VersionStatus })
  @IsOptional()
  @IsEnum(VersionStatus)
  status?: VersionStatus;
}

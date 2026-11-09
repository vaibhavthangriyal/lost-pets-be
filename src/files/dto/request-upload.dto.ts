import { IsInt, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

export class RequestUploadDto {
  @IsString() @MaxLength(255) @Matches(/^[^/\\\x00-\x1f\x7f]+$/) filename: string;
  @IsString() @MaxLength(255) @Matches(/^[a-zA-Z0-9!#$&^_.+-]+\/[a-zA-Z0-9!#$&^_.+-]+$/) mimeType: string;
  @IsInt() @Min(1) @Max(104857600) size: number;
  @IsOptional() @IsNumber({ allowInfinity: false, allowNaN: false }) @Min(0) @Max(604800) durationSeconds?: number;
}

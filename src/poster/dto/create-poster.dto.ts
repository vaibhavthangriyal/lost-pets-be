import { IsMongoId, IsNumber, IsOptional, IsString, Length, Matches, MaxLength, Min } from 'class-validator';

export class CreatePosterDto {
  @IsMongoId() postId: string;
  @IsString() @Matches(/^\+?[0-9 ()-]{7,30}$/) mobileNumber: string;
  @IsOptional() @IsNumber() @Min(0) rewardAmount?: number;
  @IsOptional() @IsString() @MaxLength(10) currency?: string;
}
export class UpdatePosterDto {
  @IsOptional() @IsString() @Length(1, 80) heading?: string;
  @IsOptional() @IsString() @Length(1, 120) title?: string;
  @IsOptional() @IsString() @Length(1, 5000) description?: string;
  @IsOptional() @IsString() @Matches(/^\+?[0-9 ()-]{7,30}$/) mobileNumber?: string;
  @IsOptional() @IsNumber() @Min(0) rewardAmount?: number;
  @IsOptional() @IsString() @MaxLength(10) currency?: string;
}

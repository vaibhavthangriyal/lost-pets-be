import { ArrayMaxSize, IsArray, IsOptional, IsString, IsUrl, Length, MaxLength, Matches } from 'class-validator';

export class OwnedPetDto {
  @IsString() @Length(1, 80) @Matches(/\S/) name: string;
  @IsString() @Length(1, 80) @Matches(/\S/) species: string;
  @IsOptional() @IsString() @MaxLength(120) breed?: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(10) @IsUrl({ require_protocol: true }, { each: true }) photos?: string[];
}

import { BadRequestException, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { AlertDto, LocationDto } from '../dto/pets.dto';
import { PetsRepository } from '../repositories/pets.repository';

function id(value: string) {
  if (!Types.ObjectId.isValid(value)) throw new BadRequestException('Invalid ID');
  return new Types.ObjectId(value);
}
function point(location: LocationDto) { return { type: 'Point', coordinates: [location.longitude, location.latitude] }; }
@Injectable()
export class PetsService {
  constructor(private repository: PetsRepository) { }
  updateAlert(userId: string, dto: AlertDto) { return this.repository.updateAlert(id(userId), point(dto.location), dto.radiusKm, dto.types); }
  getAlert(userId: string) { return this.repository.getAlert(id(userId)); }
  async deleteAlert(userId: string) { await this.repository.deleteAlert(id(userId)); return { disabled: true }; }
}

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { MetaService } from '../../meta/meta.service';
import { OwnedPetDto } from '../dto/owned-pet.dto';
import { OwnedPetRepository } from '../repositories/owned-pet.repository';

function id(value: string) { if (!Types.ObjectId.isValid(value)) throw new BadRequestException('Invalid ID'); return new Types.ObjectId(value); }
function normalized(dto: OwnedPetDto): OwnedPetDto { return { name: dto.name.trim(), species: dto.species.trim(), breed: dto.breed?.trim() ?? '', description: dto.description?.trim() ?? '', photos: dto.photos ?? [] }; }
@Injectable()
export class OwnedPetService {
  constructor(private repository: OwnedPetRepository, private metadata: MetaService) {}
  list(userId: string) { return this.repository.list(id(userId)); }
  async create(userId: string, dto: OwnedPetDto) { const data = normalized(dto); await this.metadata.validateAnimal(data.species, data.breed); return this.repository.create(id(userId), data); }
  async update(userId: string, petId: string, dto: OwnedPetDto) { const data = normalized(dto); await this.metadata.validateAnimal(data.species, data.breed); const pet = await this.repository.update(id(userId), id(petId), data); if (!pet) throw new NotFoundException('Pet not found'); return pet; }
  async delete(userId: string, petId: string) { const pet = await this.repository.delete(id(userId), id(petId)); if (!pet) throw new NotFoundException('Pet not found'); return { deleted: true }; }
}

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OwnedPetDto } from '../dto/owned-pet.dto';
import { OwnedPet } from '../entities/owned-pet.entity';

@Injectable()
export class OwnedPetRepository {
  constructor(@InjectModel(OwnedPet.name) private pets: Model<OwnedPet>) {}
  list(owner: Types.ObjectId) { return this.pets.find({ owner }).sort({ createdAt: -1 }); }
  create(owner: Types.ObjectId, data: OwnedPetDto) { return this.pets.create({ ...data, owner }); }
  update(owner: Types.ObjectId, pet: Types.ObjectId, data: OwnedPetDto) { return this.pets.findOneAndUpdate({ _id: pet, owner }, { $set: data }, { new: true, runValidators: true }); }
  delete(owner: Types.ObjectId, pet: Types.ObjectId) { return this.pets.findOneAndDelete({ _id: pet, owner }); }
}

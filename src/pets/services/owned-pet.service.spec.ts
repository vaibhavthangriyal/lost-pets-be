import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { OwnedPetRepository } from '../repositories/owned-pet.repository';
import { OwnedPetService } from './owned-pet.service';

describe('owned pets', () => {
  const owner = new Types.ObjectId(); const pet = new Types.ObjectId();
  let repository: { list: jest.Mock; create: jest.Mock; update: jest.Mock; delete: jest.Mock };
  let service: OwnedPetService;
  beforeEach(() => { repository = { list: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() }; service = new OwnedPetService(repository as unknown as OwnedPetRepository); });
  it('scopes listing to the signed-in user', () => { service.list(owner.toString()); expect(repository.list).toHaveBeenCalledWith(owner); });
  it('creates a normalized pet belonging to the signed-in user', () => { service.create(owner.toString(), { name: ' Rex ', species: ' Dog ' }); expect(repository.create).toHaveBeenCalledWith(owner, { name: 'Rex', species: 'Dog', breed: '', description: '', photos: [] }); });
  it('scopes edits to the owner and hides missing or other users pets', async () => { repository.update.mockResolvedValue(null); await expect(service.update(owner.toString(), pet.toString(), { name: 'Rex', species: 'Dog' })).rejects.toBeInstanceOf(NotFoundException); expect(repository.update).toHaveBeenCalledWith(owner, pet, expect.any(Object)); });
  it('scopes deletions to the owner', async () => { repository.delete.mockResolvedValue(null); await expect(service.delete(owner.toString(), pet.toString())).rejects.toBeInstanceOf(NotFoundException); expect(repository.delete).toHaveBeenCalledWith(owner, pet); });
  it('rejects invalid pet IDs', async () => { await expect(service.delete(owner.toString(), 'bad')).rejects.toBeInstanceOf(BadRequestException); });
});

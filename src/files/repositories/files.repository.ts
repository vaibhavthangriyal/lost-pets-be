import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UploadedFile } from '../entities/file.entity';

@Injectable()
export class FilesRepository {
  constructor(@InjectModel(UploadedFile.name) private files: Model<UploadedFile>) {}
  create(data: Partial<UploadedFile>) { return this.files.create(data); }
  listOwned(owner: Types.ObjectId) { return this.files.find({ owner }).sort({ createdAt: -1, _id: -1 }).limit(100); }
  findOwned(id: Types.ObjectId, owner: Types.ObjectId) { return this.files.findOne({ _id: id, owner }); }
  markFailed(id: Types.ObjectId) { return this.files.updateOne({ _id: id, status: 'pending' }, { $set: { status: 'failed' } }); }
  confirm(id: Types.ObjectId, owner: Types.ObjectId, generation: string) { return this.files.findOneAndUpdate({ _id: id, owner, status: 'pending' }, { $set: { status: 'uploaded', generation, confirmedAt: new Date() } }, { new: true }); }
}

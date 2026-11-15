import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../entities/user.entity';
import { OtpChallenge } from '../entities/otp-challenge.entity';

@Injectable()
export class AuthRepository {
  constructor(@InjectModel(User.name) private users: Model<User>, @InjectModel(OtpChallenge.name) private otps: Model<OtpChallenge>) {}
  saveChallenge(identifier: string, channel: 'email' | 'sms', digest: string, expiresAt: Date) {
    return this.otps.findOneAndUpdate({ identifier }, { identifier, channel, digest, expiresAt, attempts: 0 }, { upsert: true });
  }
  attemptChallenge(identifier: string) {
    return this.otps.findOneAndUpdate({ identifier, expiresAt: { $gt: new Date() }, attempts: { $lt: 5 } }, { $inc: { attempts: 1 } }, { new: true });
  }
  consumeChallenge(id: unknown, digest: string) { return this.otps.deleteOne({ _id: id, digest }); }
  async findOrCreateUser(identity: { email?: string; phoneNumber?: string }, displayName: string) {
    const clauses = [identity.email ? { email: identity.email } : null, identity.phoneNumber ? { phoneNumber: identity.phoneNumber } : null].filter(Boolean);
    const existing = await this.users.findOne({ $or: clauses as { email?: string; phoneNumber?: string }[] });
    if (existing) {
      const updates: { email?: string; phoneNumber?: string } = {};
      if (!existing.email && identity.email) updates.email = identity.email;
      if (!existing.phoneNumber && identity.phoneNumber) updates.phoneNumber = identity.phoneNumber;
      return this.users.findByIdAndUpdate(existing._id, { $set: { ...updates, displayName: existing.displayName || displayName } }, { new: true, runValidators: true });
    }
    return this.users.create({ ...identity, displayName });
  }
  findUser(id: Types.ObjectId) { return this.users.findById(id); }
  updateDisplayName(id: Types.ObjectId, displayName: string) { return this.users.findByIdAndUpdate(id, { $set: { displayName } }, { new: true, runValidators: true }); }
}

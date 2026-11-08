import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../entities/user.entity';
import { OtpChallenge } from '../entities/otp-challenge.entity';

@Injectable()
export class AuthRepository {
  constructor(@InjectModel(User.name) private users: Model<User>, @InjectModel(OtpChallenge.name) private otps: Model<OtpChallenge>) {}
  saveChallenge(email: string, digest: string, expiresAt: Date) {
    return this.otps.findOneAndUpdate({ email }, { digest, expiresAt, attempts: 0 }, { upsert: true });
  }
  attemptChallenge(email: string) {
    return this.otps.findOneAndUpdate({ email, expiresAt: { $gt: new Date() }, attempts: { $lt: 5 } }, { $inc: { attempts: 1 } }, { new: true });
  }
  consumeChallenge(id: unknown, digest: string) { return this.otps.deleteOne({ _id: id, digest }); }
  findOrCreateUser(email: string, displayName: string) {
    return this.users.findOneAndUpdate({ email }, { $setOnInsert: { email, displayName } }, { upsert: true, new: true });
  }
}

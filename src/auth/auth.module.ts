import { Module }                  from '@nestjs/common';
import { JwtModule }               from '@nestjs/jwt';
import { MongooseModule }          from '@nestjs/mongoose';
import { AuthController }          from './controllers/auth.controller';
import { OtpChallenge, OtpSchema } from './entities/otp-challenge.entity';
import { User, UserSchema }        from './entities/user.entity';
import { AuthGuard }               from './guards/auth.guard';
import { AuthRepository }          from './repositories/auth.repository';
import { AuthService }             from './services/auth.service';

@Module({
  imports: 
    [
      MongooseModule.forFeature([
        { name: User.name, schema: UserSchema },
        { name: OtpChallenge.name, schema: OtpSchema }]),
      JwtModule.registerAsync({
        useFactory: () => {
          if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET must be configured');
          return { secret: process.env.JWT_SECRET, signOptions: { expiresIn: '7d' } };
        }
      })],
  controllers: [AuthController],
  providers  : [AuthService, AuthRepository, AuthGuard],
  exports    : [AuthGuard, JwtModule],
})
export class AuthModule { }

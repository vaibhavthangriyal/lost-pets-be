import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService }                                                       from '@nestjs/jwt';
import { Types }                                                            from 'mongoose';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) { }
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const match   = /^Bearer (.+)$/.exec(request.headers.authorization ?? '');
    if (!match) throw new UnauthorizedException();
    try {
      const payload = await this.jwt.verifyAsync(match[1]);
      if (!Types.ObjectId.isValid(payload.sub)) throw new Error('Invalid subject');
      request.user = { id: payload.sub };
      return true;
    } catch { throw new UnauthorizedException(); }
  }
}

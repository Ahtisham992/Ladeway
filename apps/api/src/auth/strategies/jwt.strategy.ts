import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'super-secret-key-for-ladeway-dev',
    });
  }

  async validate(payload: any) {
    // This payload is decoded from the JWT.
    // The passport-jwt strategy automatically attaches this returned object to the request object as `req.user`.
    return { 
      userId: payload.sub, 
      tenantId: payload.tenantId, 
      role: payload.role 
    };
  }
}

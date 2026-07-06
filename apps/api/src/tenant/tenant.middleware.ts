import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { tenantContext } from './tenant.context';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  use(req: Request, res: Response, next: NextFunction) {
    let tenantId = req.headers['x-tenant-id'] as string;

    // Extract tenantId from JWT if present
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded: any = this.jwtService.decode(token);
        if (decoded && decoded.tenantId) {
          tenantId = decoded.tenantId;
        }
      } catch (e) {
        // Ignore decode errors; JwtAuthGuard will reject it later
      }
    }
    
    // In Phase 4, we will extract this from the JWT payload attached to req.user
    if (!tenantId && (req as any).user?.tenantId) {
       tenantId = (req as any).user.tenantId;
    }

    if (tenantId) {
      tenantContext.run(tenantId, () => {
        next();
      });
    } else {
      next();
    }
  }
}

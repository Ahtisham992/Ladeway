import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { tenantContext } from './tenant.context';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    let tenantId = req.headers['x-tenant-id'] as string;
    
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

import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuthService } from '../auth/auth.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TenantService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService
  ) {}

  async register({ companyName, subdomain, email, password }: any) {
    const subdomainRegex = /^[a-z0-9][a-z0-9-]{2,30}[a-z0-9]$/;
    if (!subdomainRegex.test(subdomain)) {
      throw new BadRequestException('Subdomain must be 3-32 lowercase letters, numbers, or hyphens');
    }

    const existingTenant = await this.prisma.$system.tenant.findUnique({ 
      where: { subdomain } 
    });
    if (existingTenant) {
      throw new ConflictException('This subdomain is already taken');
    }

    const existingUser = await this.prisma.$system.user.findUnique({
      where: { email }
    });
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Everything wrapped in a system-level Prisma transaction
    const { tenant, user } = await this.prisma.$system.$transaction(async (tx) => {
      const newTenant = await tx.tenant.create({
        data: {
          name: companyName,
          subdomain,
          plan: 'starter'
        }
      });

      const newUser = await tx.user.create({
        data: {
          tenantId: newTenant.id,
          email,
          passwordHash,
          role: 'ADMIN',
          name: companyName + ' Admin'
        }
      });

      // Default logistics template config
      await tx.industryConfig.create({
        data: {
          tenantId: newTenant.id,
          industryName: 'Logistics / Moving',
          personaName: 'Alexandra',
          personaRole: 'Logistics Coordinator',
          greeting: "Hi there! I'm Alexandra with your new company. I can help you get an accurate quote for your move. To start, are you moving a home or an office?",
          tone: 'professional',
          fieldsJson: [
            { key: 'move_type', label: 'Move Type', type: 'enum', required: true, options: ['home', 'office'], priority: 1, triggerLogic: 'Always ask first.' },
            { key: 'move_origin', label: 'Origin', type: 'string', required: true, priority: 2 },
            { key: 'move_destination', label: 'Destination', type: 'string', required: true, priority: 3 }
          ],
          scoringRulesJson: [
            { fieldKey: 'move_type', condition: 'equals', conditionValue: 'office', scorePoints: 40, priority: 1 },
            { fieldKey: 'move_type', condition: 'equals', conditionValue: 'home', scorePoints: 20, priority: 2 }
          ]
        }
      });

      return { tenant: newTenant, user: newUser };
    });

    // Automatically log the user in
    return this.authService.login(user);
  }

  async getPublicTenants() {
    return this.prisma.$system.tenant.findMany({
      select: {
        id: true,
        name: true,
        subdomain: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async getTenantById(id: string) {
    return this.prisma.$system.tenant.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        subdomain: true,
        plan: true,
        apiKey: true,
        createdAt: true
      }
    });
  }
}

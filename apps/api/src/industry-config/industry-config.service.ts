import { Injectable, NotFoundException, ConflictException, Inject, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { tenantContext } from '../tenant/tenant.context';
import { CreateIndustryConfigDto, UpdateIndustryConfigDto } from './schemas/config.schema';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class IndustryConfigService {
  private readonly logger = new Logger(IndustryConfigService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async create(data: CreateIndustryConfigDto) {
    const tenantId = tenantContext.getStore();
    if (!tenantId) throw new ConflictException('Tenant context missing');

    const config = await this.prisma.industryConfig.create({
      data: {
        tenantId,
        industryName: data.industryName,
        personaName: data.personaName,
        personaRole: data.personaRole,
        greeting: data.greeting,
        tone: data.tone,
        fieldsJson: data.fieldsJson as any,
        scoringRulesJson: data.scoringRulesJson as any,
        isActive: data.isActive,
      } as any,
    });
    return config;
  }

  async findAll() {
    return this.prisma.industryConfig.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPublicConfigs(tenantId?: string) {
    const whereClause: any = { isActive: true };
    if (tenantId) {
      whereClause.tenantId = tenantId;
    }
    
    return this.prisma.$system.industryConfig.findMany({
      where: whereClause,
      select: {
        id: true,
        industryName: true,
        personaName: true,
        greeting: true,
        tenantId: true,
        tenant: {
          select: {
            name: true,
            subdomain: true,
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  async findOne(id: string) {
    if (!id) throw new NotFoundException('Configuration ID is required');
    const config = await this.prisma.$system.industryConfig.findUnique({
      where: { id },
    });
    if (!config) {
      throw new NotFoundException(`IndustryConfig with ID ${id} not found`);
    }
    return config;
  }

  /**
   * Used by the Conversation Engine. Caches the config for 5 minutes.
   */
  async getActiveConfig(id: string) {
    const cacheKey = `config:${id}`;
    let config = await this.cacheManager.get(cacheKey);
    
    if (!config) {
      config = await this.findOne(id);
      await this.cacheManager.set(cacheKey, config, 300000); // 5 minutes in ms
    }
    
    return config;
  }

  async update(id: string, data: UpdateIndustryConfigDto): Promise<{ id: string, versioned: boolean }> {
    const config = await this.findOne(id);
    
    // In-place update
    const updateData: any = { ...data };
    if (data.fieldsJson) updateData.fieldsJson = data.fieldsJson as any;
    if (data.scoringRulesJson) updateData.scoringRulesJson = data.scoringRulesJson as any;

    try {
      const updated = await this.prisma.industryConfig.update({
        where: { id },
        data: updateData,
      });

      // Invalidate cache
      await this.cacheManager.del(`config:${id}`);

      return { id, versioned: false };
    } catch (error: any) {
      this.logger.error('Update failed:', error);
      throw error;
    }
  }

  async updateStatus(id: string, isActive: boolean) {
    const config = await this.findOne(id);
    const updated = await this.prisma.industryConfig.update({
      where: { id },
      data: { isActive },
    });
    await this.cacheManager.del(`config:${id}`);
    return updated;
  }

  async remove(id: string) {
    const config = await this.findOne(id);

    const conversationCount = await this.prisma.conversation.count({
      where: { configId: id },
    });

    if (conversationCount > 0) {
      throw new ConflictException(
        `Cannot delete IndustryConfig because it is linked to ${conversationCount} conversation(s). Please deactivate it instead.`
      );
    }

    await this.prisma.industryConfig.delete({
      where: { id },
    });

    // Invalidate cache
    await this.cacheManager.del(`config:${id}`);

    return config;
  }
}

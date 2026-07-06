import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { tenantContext } from '../tenant/tenant.context';
import { CreateIndustryConfigDto, UpdateIndustryConfigDto } from './schemas/config.schema';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class IndustryConfigService {
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

  async findOne(id: string) {
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

  async update(id: string, data: UpdateIndustryConfigDto) {
    // Verify existence
    await this.findOne(id);

    const updateData: any = { ...data };
    if (data.fieldsJson) updateData.fieldsJson = data.fieldsJson as any;
    if (data.scoringRulesJson) updateData.scoringRulesJson = data.scoringRulesJson as any;

    const config = await this.prisma.industryConfig.update({
      where: { id },
      data: updateData,
    });

    // Invalidate cache
    await this.cacheManager.del(`config:${id}`);

    return config;
  }

  async remove(id: string) {
    const config = await this.findOne(id);

    // Guard against deleting configs that are actively used in conversations
    const activeConversations = await this.prisma.conversation.count({
      where: { configId: id },
    });

    if (activeConversations > 0) {
      throw new ConflictException(
        `Cannot delete IndustryConfig because it is linked to ${activeConversations} active conversation(s).`
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

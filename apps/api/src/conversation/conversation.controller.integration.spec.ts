import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ConversationController } from './conversation.controller';
import { ConversationService } from './conversation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantMiddleware } from '../tenant/tenant.middleware';
import { SessionService } from '../session/session.service';
import { PrismaService } from '../database/prisma.service';

describe('ConversationController (Integration)', () => {
  let app: INestApplication;
  const mockConversationService = {
    startConversation: jest.fn().mockResolvedValue({ id: 'conv_123', message: 'Hi there!' }),
    sendMessage: jest.fn().mockImplementation(async function* () {
      yield 'How can I help?';
      yield JSON.stringify({ _done: true, status: 'IN_PROGRESS', turnCount: 1 });
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ConversationController],
      providers: [
        {
          provide: ConversationService,
          useValue: mockConversationService,
        },
        {
          provide: SessionService,
          useValue: {},
        },
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true }) // Mock Auth
      .compile();

    app = moduleFixture.createNestApplication();
    
    // We mock the middleware since we aren't testing DB connections here
    app.use((req: any, res: any, next: any) => {
      req.tenantId = 'test-tenant';
      next();
    });
    
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('/conversations/start (POST)', () => {
    return request(app.getHttpServer())
      .post('/conversations/start')
      .send({ configId: 'ind_1' })
      .expect(201)
      .expect({
        id: 'conv_123',
        message: 'Hi there!',
      });
  });

  it('/conversations/message (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/conversations/conv_123/message')
      .send({ sessionToken: 'conv_123', message: 'I need help' })
      .expect(201);
      
    expect(response.text).toContain('event: token');
    expect(response.text).toContain('data: {"content":"How can I help?"}');
    expect(response.text).toContain('event: done');
  });
});

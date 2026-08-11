import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ConversationController } from './conversation.controller';
import { ConversationService } from './conversation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantMiddleware } from '../tenant/tenant.middleware';

describe('ConversationController (Integration)', () => {
  let app: INestApplication;
  const mockConversationService = {
    startConversation: jest.fn().mockResolvedValue({ id: 'conv_123', message: 'Hi there!' }),
    processMessage: jest.fn().mockResolvedValue({ id: 'conv_123', reply: 'How can I help?' }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ConversationController],
      providers: [
        {
          provide: ConversationService,
          useValue: mockConversationService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true }) // Mock Auth
      .compile();

    app = moduleFixture.createNestApplication();
    
    // We mock the middleware since we aren't testing DB connections here
    app.use((req, res, next) => {
      req.tenantId = 'test-tenant';
      next();
    });
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/conversations/start (POST)', () => {
    return request(app.getHttpServer())
      .post('/conversations/start')
      .send({ industryId: 'ind_1' })
      .expect(201)
      .expect({
        id: 'conv_123',
        message: 'Hi there!',
      });
  });

  it('/conversations/message (POST)', () => {
    return request(app.getHttpServer())
      .post('/conversations/message')
      .send({ sessionId: 'conv_123', message: 'I need help' })
      .expect(201)
      .expect({
        id: 'conv_123',
        reply: 'How can I help?',
      });
  });
});

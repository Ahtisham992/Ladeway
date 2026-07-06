import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ConversationService } from './src/conversation/conversation.service';

async function test() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const conversationService = app.get(ConversationService);

  try {
    const res = await conversationService.startConversation('cmr949a550003wwi3ze5awv2t');
    console.log(res);
  } catch (err) {
    console.error('ERROR OCCURRED:');
    console.error(err);
  }
  await app.close();
}

test();

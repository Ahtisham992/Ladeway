import { z } from 'zod';

export const StartConversationSchema = z.object({
  configId: z.string().min(1),
});

export type StartConversationDto = z.infer<typeof StartConversationSchema>;

export const SendMessageSchema = z.object({
  sessionToken: z.string().min(1),
  message: z.string().min(1),
});

export type SendMessageDto = z.infer<typeof SendMessageSchema>;

export interface StartConversationResponse {
  conversationId: string;
  sessionToken: string;
  greeting: string;
}

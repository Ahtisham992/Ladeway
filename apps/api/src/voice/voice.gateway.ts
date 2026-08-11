import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { WebSocket } from 'ws';
import { Logger } from '@nestjs/common';
import { VoiceOrchestratorService } from './voice-orchestrator.service';
import { randomUUID } from 'crypto';

@WebSocketGateway({ path: '/voice/stream', cors: true })
export class VoiceGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(VoiceGateway.name);

  constructor(private readonly orchestrator: VoiceOrchestratorService) {}

  handleConnection(client: WebSocket, ...args: any[]) {
    const request = args[0];
    const url = new URL(request.url, 'http://localhost');
    const configId = url.searchParams.get('configId') || 'cmrj033sz0003xwi3nem2n3hm';

    const callId = randomUUID();
    (client as any).callId = callId;
    this.logger.log(`Client connected to Voice Gateway: ${callId}`);

    // Listen for ALL incoming messages (binary audio frames from the browser)
    client.on('message', (data: Buffer | string, isBinary: boolean) => {
      if (isBinary || Buffer.isBuffer(data)) {
        this.orchestrator.handleAudioIn(callId, Buffer.from(data as any));
      } else {
        // Could be a JSON control message from the frontend
        try {
          const msg = JSON.parse(data.toString());
          this.logger.log(`Control message from client: ${JSON.stringify(msg)}`);
        } catch {
          // Not JSON, ignore
        }
      }
    });

    this.orchestrator.handleNewCall(callId, client, configId);
  }

  handleDisconnect(client: WebSocket) {
    const callId = (client as any).callId;
    this.logger.log(`Client disconnected from Voice Gateway: ${callId}`);
    this.orchestrator.handleDisconnect(callId);
  }
}

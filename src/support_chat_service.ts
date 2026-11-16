import { InfraiClient } from "./infrai_client.ts";
import { z } from "zod";

export const chatRequestSchema = z.object({
  playerId: z.string().min(1),
  accountId: z.string().min(1),
  channel: z.string().min(1),
  message: z.string().min(1),
  assetId: z.string().min(1).optional(),
  liveEvent: z.string().min(1).optional()
});
export type ChatRequest = z.infer<typeof chatRequestSchema>;

export type ChatDecision = { queue: "support" | "moderation"; event: "player.message"; data: ChatRequest };

export function decideQueue(input: ChatRequest): ChatDecision {
  const queue = input.assetId ? "moderation" : "support";
  return { queue, event: "player.message", data: input };
}

export class SupportChatService {
  private client: InfraiClient;
  constructor(client: InfraiClient) { this.client = client; }

  async open(input: ChatRequest): Promise<ChatDecision> {
    const request = chatRequestSchema.parse(input);
    const decision = decideQueue(request);
    await this.client.createChannel(request.channel);
    await this.client.publish(request.channel, decision.event, { ...request, queue: decision.queue }, request.accountId);
    return decision;
  }

  async close(channel: string, transcript: string, visitorEmail: string) {
    return this.client.sendTranscript(visitorEmail, `Game support transcript: ${channel}`, transcript);
  }
}

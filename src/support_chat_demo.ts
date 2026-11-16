import { InfraiClient, infrai } from "./infrai_client.ts";
import { SupportChatService } from "./support_chat_service.ts";

const service = new SupportChatService(new InfraiClient());
const request = {
  playerId: process.env.PLAYER_ID ?? "player-7",
  accountId: process.env.ACCOUNT_ID ?? "game-prod",
  channel: process.env.CHAT_CHANNEL ?? "player-support-demo",
  message: process.env.PLAYER_MESSAGE ?? "My event reward is missing"
};

console.log(`Using ${infrai.realtime.channel.create}, ${infrai.realtime.publish}, and ${infrai.email.send}`);
const decision = await service.open(request);
console.log(JSON.stringify({ accepted: true, queue: decision.queue, channel: request.channel }));
if (process.env.VISITOR_EMAIL) {
  const result = await service.close(request.channel, `${request.playerId}: ${request.message}`, process.env.VISITOR_EMAIL);
  console.log(JSON.stringify({ transcriptSent: true, messageId: result.message_id }));
}

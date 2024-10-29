import { WebSocket } from "ws";

export interface Client extends WebSocket {
  userId?: string;
  userName?: string;
}

export interface ChatMessage {
  type: "chat" | "system";
  message: string;
  sender?: string;
  timeStamp: number;
}

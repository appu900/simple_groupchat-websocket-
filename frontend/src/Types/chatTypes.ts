

export interface ChatMessage{
    type: "chat" | "system";
    message: string;
    sender?: string;
    timeStamp: number;
}
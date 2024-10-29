import express from "express";
import { createServer } from "http";
import { WebSocket, WebSocketServer } from "ws";
import { randomUUID } from "crypto";
import { Client, ChatMessage } from "./Types";

const app = express();
const server = createServer(app);
const wss = new WebSocket.Server({ server });

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

const clients: Map<string, Client> = new Map();

// -- function for send brodcast message for all the clients excluding the currennt client
const brodcast = (message: ChatMessage, excludeClient?: string) => {
  const messageStr = JSON.stringify(message);
  clients.forEach((client, userId) => {
    if (client.readyState === WebSocket.OPEN && userId != excludeClient) {
      client.send(messageStr);
    }
  });
};

// handle websocket sever
wss.on("connection", function handleConnection(ws: Client) {
  const userId = randomUUID();
  ws.userId = userId;
  clients.set(userId, ws);

  //   ** send a welcome message to the client
  const welcomeMessage: ChatMessage = {
    type: "system",
    message: "Welcome to the chat ! please set your username",
    timeStamp: Date.now(),
  };

  //   ** send the message
  ws.send(JSON.stringify(welcomeMessage));

  //   -- handle incoming messages

  ws.on("message", function handleMessage(rawData: string) {
    try {
      const data = JSON.parse(rawData.toString());

      //   -- handle set UserName
      if (data.type === "setUsername") {
        ws.userName = data.username;

        // -- generate the system message
        const systemMessage: ChatMessage = {
          type: "system",
          message: `${ws.userName} has joined the chat`,
          timeStamp: Date.now(),
        };

        brodcast(systemMessage, ws.userId);
        return;
      }

      //  -- handle chat messages

      if (data.type === "chat" && ws.userName) {
        const chatMessage: ChatMessage = {
          type: "chat",
          message: data.message,
          sender: ws.userName,
          timeStamp: Date.now(),
        };
        brodcast(chatMessage, ws.userId);
      }
    } catch (error) {
      console.log("Error in processing message", error);
    }
  });

  //   -- handle client disconnection

  ws.on("close", function handleDisconnect() {
    if (ws.userName) {
      const systemMessage: ChatMessage = {
        type: "system",
        message: `${ws.userName} has left the chat`,
        timeStamp: Date.now(),
      };
      brodcast(systemMessage, ws.userId);
    }
    if (ws.userId) {
      clients.delete(ws.userId);
    }
  });

  //  -- handle errors

  ws.on("error", function handleError(error) {
    console.log("Error in connection", error);
    if (ws.userId) {
      clients.delete(ws.userId);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

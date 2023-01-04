import { Key } from "aws-sdk/clients/dynamodb";

export type Action = "$connect" | "$disconnect" | "getMessages" | "sendMessage" | "getClients";

export type Client = {
  connectionId: string;
  nickname: string;
};

export type SendMessage = {
  message: string;
  recipientNickName: string;
};

export type GetMessages = {
  targetNickname: string;
  limit: number;
  startKey: Key | undefined;
};

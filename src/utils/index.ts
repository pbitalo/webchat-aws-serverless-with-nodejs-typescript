import { Client, GetMessages, SendMessage } from "../models/Entities";
import { HandlerError } from "../models/Response";

export const parseSendMessage = (body: string | null): SendMessage => {
  const msg = JSON.parse(body || "{}") as SendMessage;

  if (!msg || !msg.recipientNickName || !msg.message) {
    throw new HandlerError("Contrato inválido para envio de mensagem");
  }

  return msg;
};

export const parseGetMessage = (body: string | null): GetMessages => {
  const msg = JSON.parse(body || "{}") as GetMessages;

  if (!msg || !msg.targetNickname || !msg.limit) {
    throw new HandlerError("Contrato inválido para receber mensagens");
  }

  return msg;
};

export const createMessage = (clients: Client[]): string => JSON.stringify({ type: "clients", value: { clients } });

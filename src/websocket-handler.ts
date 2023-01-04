import { APIGatewayProxyEvent, APIGatewayProxyEventQueryStringParameters, APIGatewayProxyResult } from "aws-lambda";
import AWS, { AWSError } from "aws-sdk";

import { Action, Client, GetMessages, SendMessage } from "./models/Entities";
import { HandlerError, responseError, responseForbidden, responseOk } from "./models/Response";

import { ClientsInterface } from "./store/clients-interface";
import { ClientsDbStore } from "./store/dynamodb/clients-store";
import { MessagesDbStore } from "./store/dynamodb/messages-store";
import { MessagesInterface } from "./store/messages-interface";
import { createMessage, parseGetMessage, parseSendMessage } from "./utils";

const clientsStore: ClientsInterface = new ClientsDbStore();
const messagesStore: MessagesInterface = new MessagesDbStore();

const apiGw = new AWS.ApiGatewayManagementApi({
  endpoint: process.env["WSSAPIGATEWAYENDPOINT"],
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const connectionId = event.requestContext.connectionId as string;
  const routeKey = event.requestContext.routeKey as Action;

  try {
    switch (routeKey) {
      case "$connect":
        return handleConnect(connectionId, event.queryStringParameters);
      case "$disconnect":
        return handleDisconnect(connectionId);
      case "getClients":
        return handleGetClients(connectionId);
      case "sendMessage":
        return handleSendMessage(connectionId, parseSendMessage(event.body));
      case "getMessages":
        return handleGetMessages(await clientsStore.getClient(connectionId), parseGetMessage(event.body));
      default:
        return responseError(routeKey);
    }
  } catch (e) {
    if (e instanceof HandlerError) {
      await sendData(connectionId, JSON.stringify({ type: "error", message: e.message }));
      return responseOk;
    }
    throw e;
  }
};

const handleConnect = async (
  connectionId: string,
  parameters: APIGatewayProxyEventQueryStringParameters | null,
): Promise<APIGatewayProxyResult> => {
  if (!parameters || !parameters.nickname) {
    return responseForbidden;
  }

  const existingConnectionId = await clientsStore.getConnectionIdByNickname(parameters.nickname);

  if (existingConnectionId && (await sendData(existingConnectionId, JSON.stringify({ type: "ping" })))) {
    return responseForbidden;
  }

  await clientsStore.insertClient(connectionId, parameters.nickname);

  await notifyClients(connectionId);

  return responseOk;
};

const handleDisconnect = async (connectionId: string): Promise<APIGatewayProxyResult> => {
  await clientsStore.deleteClient(connectionId);

  await notifyClients(connectionId);

  return responseOk;
};

const notifyClients = async (excludeConnectionId: string) => {
  const clients = await clientsStore.getAllClients();
  await Promise.all(
    clients
      .filter((client) => client.connectionId !== excludeConnectionId)
      .map(async (client) => {
        await sendData(client.connectionId, createMessage(clients));
      }),
  );
};

const sendData = async (connectionId: string, data: string): Promise<boolean> => {
  try {
    await apiGw
      .postToConnection({
        ConnectionId: connectionId,
        Data: JSON.stringify(data),
      })
      .promise();

    return true;
  } catch (e) {
    if ((e as AWSError).statusCode !== 410) {
      throw e;
    }

    await clientsStore.deleteClient(connectionId);

    return false;
  }
};

const handleGetClients = async (connectionId: string): Promise<APIGatewayProxyResult> => {
  const clients = await clientsStore.getAllClients();

  await sendData(connectionId, createMessage(clients));

  return responseOk;
};

const handleSendMessage = async (senderConnectionId: string, body: SendMessage): Promise<APIGatewayProxyResult> => {
  const senderClient = await clientsStore.getClient(senderConnectionId);

  const nicknameToNickname = [senderClient.nickname, body.recipientNickName].sort().join("#");

  await messagesStore.insertMessage(nicknameToNickname, body.message, senderClient.nickname);

  const clientReceiptConnectionId = await clientsStore.getConnectionIdByNickname(body.recipientNickName);

  if (clientReceiptConnectionId) {
    await sendData(
      clientReceiptConnectionId,
      JSON.stringify({
        type: "message",
        value: {
          sender: senderClient.nickname,
          message: body.message,
        },
      }),
    );
  }

  return responseOk;
};

const handleGetMessages = async (client: Client, body: GetMessages) => {
  const result = await messagesStore.getMessages(client, body);

  await sendData(
    client.connectionId,
    JSON.stringify({
      type: "messages",
      value: {
        messages: result.Items && result.Items.length > 0 ? result.Items : [],
        lastEvaluatedKey: result.LastEvaluatedKey,
      },
    }),
  );

  return responseOk;
};

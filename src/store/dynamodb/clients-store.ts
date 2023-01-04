import { PromiseResult } from "aws-sdk/lib/request";
import AWS from "aws-sdk";

import { ClientsInterface } from "../clients-interface";
import { HandlerError } from "../../models/Response";
import { Client } from "../../models/Entities";

const docClient = new AWS.DynamoDB.DocumentClient();
const TableName = "Clients";

export class ClientsDbStore implements ClientsInterface {
  async deleteClient(
    connectionId: string,
  ): Promise<PromiseResult<AWS.DynamoDB.DocumentClient.DeleteItemOutput, AWS.AWSError>> {
    return await docClient
      .delete({
        TableName,
        Key: {
          connectionId,
        },
      })
      .promise();
  }

  async getClient(connectionId: string): Promise<Client> {
    const result = await docClient
      .get({
        TableName,
        Key: {
          connectionId,
        },
      })
      .promise();

    if (!result.Item) {
      throw new HandlerError("Cliente não existe");
    }

    return result.Item as Client;
  }

  async getAllClients(): Promise<Client[]> {
    const result = await docClient
      .scan({
        TableName,
      })
      .promise();
    const clients = result.Items || [];
    return clients as Client[];
  }

  async insertClient(
    connectionId: string,
    nickname: string,
  ): Promise<PromiseResult<AWS.DynamoDB.DocumentClient.PutItemOutput, AWS.AWSError>> {
    return docClient
      .put({
        TableName,
        Item: {
          connectionId,
          nickname,
        },
      })
      .promise();
  }

  async getConnectionIdByNickname(nickname: string): Promise<string | undefined> {
    const result = await docClient
      .query({
        TableName,
        IndexName: "NicknameIndex",
        KeyConditionExpression: "#nickname = :nickname",
        ExpressionAttributeNames: {
          "#nickname": "nickname",
        },
        ExpressionAttributeValues: {
          ":nickname": nickname,
        },
      })
      .promise();

    return result.Items && result.Items.length > 0 ? result.Items[0].connectionId : undefined;
  }
}

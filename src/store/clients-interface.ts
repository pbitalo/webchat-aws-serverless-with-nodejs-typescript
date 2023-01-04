import { PromiseResult } from "aws-sdk/lib/request";
import { Client } from "../models/Entities";

export interface ClientsInterface {
  getClient: (connectionId: string) => Promise<Client>;
  getAllClients: () => Promise<Client[]>;
  insertClient: (
    connectionId: string,
    nickname: string,
  ) => Promise<PromiseResult<AWS.DynamoDB.DocumentClient.PutItemOutput, AWS.AWSError>>;
  getConnectionIdByNickname(nickname: string): Promise<string | undefined>;
  deleteClient(
    connectionId: string,
  ): Promise<PromiseResult<AWS.DynamoDB.DocumentClient.DeleteItemOutput, AWS.AWSError>>;
}

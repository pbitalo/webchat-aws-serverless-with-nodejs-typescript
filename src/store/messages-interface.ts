import { PromiseResult } from "aws-sdk/lib/request";
import { Client, GetMessages } from "../models/Entities";

export interface MessagesInterface {
  insertMessage: (
    nicknameToNickname: string,
    message: string,
    senderClient: string,
  ) => Promise<PromiseResult<AWS.DynamoDB.DocumentClient.PutItemOutput, AWS.AWSError>>;

  getMessages: (
    client: Client,
    body: GetMessages,
  ) => Promise<PromiseResult<AWS.DynamoDB.DocumentClient.QueryOutput, AWS.AWSError>>;
}

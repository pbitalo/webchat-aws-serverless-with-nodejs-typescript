import { PromiseResult } from "aws-sdk/lib/request";
import AWS from "aws-sdk";
import { v4 } from "uuid";

import { Client, GetMessages } from "../../models/Entities";
import { MessagesInterface } from "../messages-interface";

const TableName = "Messages";
const docClient = new AWS.DynamoDB.DocumentClient();

export class MessagesDbStore implements MessagesInterface {
  async insertMessage(nicknameToNickname: string, message: string, senderClient: string) {
    return docClient
      .put({
        TableName,
        Item: {
          messageId: v4(),
          createdAt: new Date().getTime(),
          nicknameToNickname,
          message,
          sender: senderClient,
        },
      })
      .promise();
  }

  async getMessages(
    client: Client,
    body: GetMessages,
  ): Promise<PromiseResult<AWS.DynamoDB.DocumentClient.QueryOutput, AWS.AWSError>> {
    return docClient
      .query({
        TableName,
        IndexName: "NicknameToNicknameIndex",
        KeyConditionExpression: "#nicknameToNickname = :nicknameToNickname",
        ExpressionAttributeNames: {
          "#nicknameToNickname": "nicknameToNickname",
        },
        ExpressionAttributeValues: {
          ":nicknameToNickname": getNicknameToNickname([client.nickname, body.targetNickname]),
        },
        Limit: body.limit,
        ExclusiveStartKey: body.startKey,
        ScanIndexForward: false,
      })
      .promise();
  }
}

const getNicknameToNickname = (nicknames: string[]) => nicknames.sort().join("#");

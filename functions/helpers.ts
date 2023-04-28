import { DynamoDB } from "@aws-sdk/client-dynamodb"

export async function getUsers(stage: string, database: DynamoDB) {
  const params = {
    TableName: `${stage}-users`,
  }
  return database.scan(params)
}
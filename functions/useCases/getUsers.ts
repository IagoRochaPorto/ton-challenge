import { DynamoDB, ScanCommandInput } from '@aws-sdk/client-dynamodb'
import { User } from '../user'

type GetUsersParams = {
  stage: string
  db: DynamoDB
}

export async function getUsers(params: GetUsersParams): Promise<Pick<User, 'username'>[]> {
  const { db, stage } = params
  let options: ScanCommandInput = {
    TableName: `${stage}-users`,
    ProjectionExpression: 'username',
  }
  const { Items: users = [] } = await db.scan(options)

  return users
    .filter((user) => user.username.S)
    .map((user) => ({
      username: user.username.S!,
    }))
}

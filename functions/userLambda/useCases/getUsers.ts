import { DynamoDB, ScanCommandInput } from '@aws-sdk/client-dynamodb'
import { User } from '../user'
import { NotFoundError } from '../errors'

export async function getUsers(stage: string, db: DynamoDB): Promise<Pick<User, 'username'>[]> {
  let options: ScanCommandInput = {
    TableName: `${stage}-users`,
    ProjectionExpression: 'username',
  }
  const { Items: users } = await db.scan(options)

  if (!users?.length) {
    throw new NotFoundError('Users not found')
  }
  return users
    .filter((user) => user.username.S)
    .map((user) => ({
      username: user.username.S!,
    }))
}

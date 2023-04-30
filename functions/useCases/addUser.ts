import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { User } from '../user'
import { randomUUID } from 'node:crypto'
import { hashSync } from 'bcryptjs'
import { NotFoundError } from '../errors'

type AddUserParams = {
  user: Partial<Omit<User, 'userId'>>
}

export async function addUser(stage: string, db: DynamoDB, params: AddUserParams): Promise<Partial<User>> {
  const { user } = params
  const isUser = validate(user)

  if (!isUser) {
    throw new Error('Invalid user')
  }

  const hashedPassword = hashSync(user.password, 12)
  await db.putItem({
    TableName: `${stage}-users`,
    Item: {
      userId: { S: randomUUID() },
      username: { S: user.username },
      email: { S: user.email },
      password: { S: hashedPassword },
    },
  })

  const { Items: users } = await db.scan({
    TableName: `${stage}-users`,
    FilterExpression: 'username = :username',
    ExpressionAttributeValues: {
      ':username': { S: user.username! },
    },
  })

  if (!users?.length) {
    throw new NotFoundError('User not found')
  }

  return {
    userId: users[0].userId.S,
    username: users[0].username.S,
    email: users[0].email.S,
  }
}

function validate(user: Partial<User>): user is User {
  if (!user.username) {
    throw new Error('Username is required')
  }

  if (!user.email) {
    throw new Error('Email is required')
  }

  if (!user.password) {
    throw new Error('Password is required')
  }

  return true
}

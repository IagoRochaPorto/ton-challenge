import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { User } from '../user'
import bcrypt from 'bcryptjs'
import { BadRequestError, NotFoundError, UnauthorizedError } from '../errors'

export type AuthUserParams = {
  user: Partial<Pick<User, 'username' | 'password'>>
  stage: string
  db: DynamoDB
}

export async function authUser(params: AuthUserParams) {
  const { db, stage, user } = params
  if (!user.password) {
    throw new BadRequestError('Missing password')
  }

  const { Items: users } = await db.scan({
    TableName: `${stage}-users`,
    FilterExpression: 'username = :username',
    ExpressionAttributeValues: {
      ':username': { S: user.username! },
    },
    ProjectionExpression: 'username, password, id, email',
  })

  if (!users?.length) {
    throw new NotFoundError('User not found')
  }

  const authenticatedUser = users[0]

  if (!authenticatedUser.password?.S) {
    throw new BadRequestError('User not found')
  }

  const isPasswordValid = await bcrypt.compare(user.password, authenticatedUser.password.S)

  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid password')
  }

  if (!authenticatedUser.id?.S || !authenticatedUser.username?.S || !authenticatedUser.email?.S) {
    throw new BadRequestError('User not found')
  }

  return {
    id: authenticatedUser.id.S,
    username: authenticatedUser.username.S,
    email: authenticatedUser.email.S,
  }
}

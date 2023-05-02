import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { User } from '../user'
import { randomUUID } from 'node:crypto'
import { BadRequestError, NotFoundError } from '../errors'
import validator from 'validator'
import bcrypt from 'bcryptjs'

type AddUserParams = {
  user: Partial<Omit<User, 'id'>>
  stage: string
  db: DynamoDB
}

export async function addUser(params: AddUserParams): Promise<Partial<User>> {
  const { db, stage, user } = params
  const isUser = validate(user)

  if (!isUser) {
    throw new BadRequestError('Invalid user')
  }

  const isEmailValid = validator.isEmail(user.email)
  const isPasswordSecure = validator.isStrongPassword(user.password)

  if (!isEmailValid) {
    throw new BadRequestError('Invalid email')
  }

  if (!isPasswordSecure) {
    throw new BadRequestError('Password is not secure')
  }

  const hashedPassword = await bcrypt.hash(user.password, 10)

  await db.putItem({
    TableName: `${stage}-users`,
    Item: {
      id: { S: randomUUID() },
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
    id: users[0].id.S,
    username: users[0].username.S,
    email: users[0].email.S,
  }
}

function validate(user: Partial<User>): user is User {
  if (!user.username || !user.email || !user.password) {
    return false
  }

  return true
}

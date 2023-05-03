import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { User } from '../user'
import { randomUUID } from 'node:crypto'
import { BadRequestError } from '../errors'
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

  const { Items: users } = await db.scan({
    TableName: `${stage}-users`,
    FilterExpression: 'username = :username',
    ExpressionAttributeValues: {
      ':username': { S: user.username! },
    },
  })

  if (users?.length) {
    throw new BadRequestError('User already exists')
  }

  const userToCreate = {
    id: { S: randomUUID() },
    username: { S: user.username },
    email: { S: user.email },
    password: { S: hashedPassword },
  }

  await db.putItem({
    TableName: `${stage}-users`,
    Item: userToCreate,
  })

  return {
    id: userToCreate.id.S,
    username: userToCreate.username.S,
    email: userToCreate.email.S,
  }
}

function validate(user: Partial<User>): user is User {
  if (!user.username || !user.email || !user.password) {
    return false
  }

  return true
}

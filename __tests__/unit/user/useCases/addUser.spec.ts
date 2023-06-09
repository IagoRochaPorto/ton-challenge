import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { addUserStub } from '../stubs/user'
import { User } from '../../../../functions/userLambda/user'
import { addUser } from '../../../../functions/userLambda/useCases'
import { BadRequestError, NotFoundError } from '../../../../functions/userLambda/errors'
import validator from 'validator'

const config = {
  endpoint: 'http://localhost:8000',
  region: 'local-env',
}

jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDB: jest.fn().mockImplementation(() => ({
    putItem: jest.fn().mockImplementation(() => ({
      promise: jest.fn().mockResolvedValue({}),
    })),
    scan: jest.fn().mockImplementation(() => Promise.resolve({ Items: null })),
  })),
}))

jest.mock('node:crypto', () => ({
  randomUUID: jest.fn().mockReturnValue('any_uuid'),
}))

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('any_hash'),
}))

jest.mock('validator', () => ({
  isEmail: jest.fn().mockReturnValue(true),
  isStrongPassword: jest.fn().mockReturnValue(true),
}))

function makeSut() {
  const db = new DynamoDB(config)
  const stage = 'test'
  const sut = (user: Partial<User>) => addUser({ stage, db, user })
  return { db, sut }
}

describe('Add User Use Case', () => {
  it('Should throw Validation Errors if user is invalid', async () => {
    const { sut } = makeSut()

    const promise = sut({ username: 'any_username' })

    await expect(promise).rejects.toThrow(new BadRequestError('Invalid user'))
  })

  it("Should call DynamoDB's putItem with correct params", async () => {
    const { sut, db } = makeSut()
    const dbSpy = jest.spyOn(db, 'putItem')

    await sut(addUserStub)

    expect(dbSpy).toHaveBeenCalledWith({
      TableName: 'test-users',
      Item: {
        id: { S: 'any_uuid' },
        username: { S: addUserStub.username },
        email: { S: addUserStub.email },
        password: { S: 'any_hash' },
      },
    })
  })

  it('Should throw Validation Errors if email is invalid', async () => {
    const { sut } = makeSut()
    jest.spyOn(validator, 'isEmail').mockReturnValueOnce(false)

    const promise = sut(addUserStub)

    await expect(promise).rejects.toThrow(new BadRequestError('Invalid email'))
  })

  it('Should throw Validation Errors if password is not secure', async () => {
    const { sut } = makeSut()
    jest.spyOn(validator, 'isStrongPassword').mockReturnValueOnce(false as any)

    const promise = sut(addUserStub)

    await expect(promise).rejects.toThrow(new BadRequestError('Password is not secure'))
  })

  it('Should throw already exists if user is found', async () => {
    const { sut, db } = makeSut()
    jest.spyOn(db, 'scan').mockImplementationOnce(() =>
      Promise.resolve({
        Items: [
          {
            id: { S: 'any_uuid' },
            username: { S: 'any_username' },
            email: { S: 'any_email' },
          },
        ],
      })
    )

    const promise = sut(addUserStub)

    await expect(promise).rejects.toThrow(new BadRequestError('User already exists'))
  })

  it('Should return a user if user is found', async () => {
    const { sut } = makeSut()

    const user = await sut(addUserStub)

    expect(user).toEqual({
      id: 'any_uuid',
      username: 'any_username',
      email: 'any_email',
    })
  })
})

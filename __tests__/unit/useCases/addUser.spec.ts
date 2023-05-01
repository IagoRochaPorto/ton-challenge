import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { addUser } from '../../functions/useCases'
import { User } from '../../functions/user'
import { BadRequestError, NotFoundError } from '../../functions/errors'
import { addUserStub } from '../stubs/user'

const config = {
  endpoint: 'http://localhost:8000',
  region: 'local-env',
}

jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDB: jest.fn().mockImplementation(() => ({
    putItem: jest.fn().mockImplementation(() => ({
      promise: jest.fn().mockResolvedValue({}),
    })),
    scan: jest.fn().mockImplementation(() =>
      Promise.resolve({
        Items: [
          {
            id: { S: 'any_uuid' },
            username: { S: 'any_username' },
            email: { S: 'any_email' },
          },
        ],
      })
    ),
  })),
}))

jest.mock('node:crypto', () => ({
  randomUUID: jest.fn().mockReturnValue('any_uuid'),
}))

jest.mock('bcryptjs', () => ({
  hashSync: jest.fn().mockReturnValue('any_hash'),
}))

function makeSut() {
  const db = new DynamoDB(config)
  const sut = (user: Partial<User>) => addUser('test', db, { user })
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

  it('Should throw NotFoundError if user is not found', async () => {
    const { sut, db } = makeSut()
    jest.spyOn(db, 'scan').mockImplementationOnce(() => Promise.resolve({ Items: null }))

    const promise = sut(addUserStub)

    await expect(promise).rejects.toThrow(new NotFoundError('User not found'))
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

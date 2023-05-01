import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { authUserStub } from '../stubs/user'
import * as Bcrypt from 'bcryptjs'
import { AuthUserParams, authUser } from '../../../../functions/userLambda/useCases'
import { BadRequestError } from '../../../../functions/userLambda/errors'

const config = {
  endpoint: 'http://localhost:8000',
  region: 'local-env',
}

jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDB: jest.fn().mockImplementation(() => ({
    scan: jest.fn().mockImplementation(() =>
      Promise.resolve({
        Items: [
          {
            id: { S: 'any_uuid' },
            username: { S: 'any_username' },
            email: { S: 'any_email' },
            password: { S: 'any_hash' },
          },
        ],
      })
    ),
  })),
}))

jest.mock('bcryptjs', () => ({
  compareSync: jest.fn().mockReturnValue(true),
}))

function makeSut() {
  const db = new DynamoDB(config)
  const sut = (user: AuthUserParams) => authUser('test', db, user)
  return { db, sut }
}

describe('Auth user use case', () => {
  it('Should throw an error if password is missing', async () => {
    const { sut } = makeSut()

    const promise = sut({ username: 'any_username' })

    await expect(promise).rejects.toThrow('Missing password')
  })

  it('Should call DynamoDB scan with correct params', async () => {
    const { db, sut } = makeSut()
    const scanSpy = jest.spyOn(db, 'scan')

    await sut(authUserStub)

    expect(scanSpy).toHaveBeenCalledWith({
      TableName: 'test-users',
      FilterExpression: 'username = :username',
      ExpressionAttributeValues: {
        ':username': { S: 'any_username' },
      },
      ProjectionExpression: 'username, password, id, email',
    })
  })

  it('Should throw an UnauthorizedError if user password was not found', async () => {
    const { sut, db } = makeSut()
    jest.spyOn(db, 'scan').mockImplementationOnce(() =>
      Promise.resolve({
        Items: [{ password: null }],
      })
    )
    const promise = sut(authUserStub)

    await expect(promise).rejects.toThrow('User not found')
  })

  it('Should throw an UnauthorizedError if user is not found', async () => {
    const { sut, db } = makeSut()
    jest.spyOn(db, 'scan').mockImplementationOnce(() => Promise.resolve({ Items: null }))

    const promise = sut(authUserStub)

    await expect(promise).rejects.toThrow('User not found')
  })

  it('Should throw an UnauthorizedError if password is invalid', async () => {
    const { sut } = makeSut()
    jest.spyOn(Bcrypt, 'compareSync').mockReturnValueOnce(false)

    const promise = sut(authUserStub)

    await expect(promise).rejects.toThrow('Invalid password')
  })

  it('Should throw BadRequestError if user is not confirmed', async () => {
    const { sut, db } = makeSut()
    jest.spyOn(db, 'scan').mockImplementationOnce(() =>
      Promise.resolve({
        Items: [{ password: { S: 'any_hash' } }],
      })
    )

    const promise1 = sut(authUserStub)

    jest.spyOn(db, 'scan').mockImplementationOnce(() =>
      Promise.resolve({
        Items: [{ password: { S: 'any_hash' }, id: { S: 'any_id' } }],
      })
    )

    const promise2 = sut(authUserStub)

    jest.spyOn(db, 'scan').mockImplementationOnce(() =>
      Promise.resolve({
        Items: [{ password: { S: 'any_hash' }, id: { S: 'any_id' }, username: { S: 'username' } }],
      })
    )

    const promise3 = sut(authUserStub)

    await expect(promise1).rejects.toThrow(new BadRequestError('User not found'))
    await expect(promise2).rejects.toThrow(new BadRequestError('User not found'))
    await expect(promise3).rejects.toThrow(new BadRequestError('User not found'))
  })

  it('Should return an user if password is valid', async () => {
    const { sut } = makeSut()

    const user = await sut(authUserStub)

    expect(user).toEqual({
      id: 'any_uuid',
      username: 'any_username',
      email: 'any_email',
    })
  })
})

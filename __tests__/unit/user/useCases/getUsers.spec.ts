import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { getUsers } from '../../../../functions/userLambda/useCases'
import { NotFoundError } from '../../../../functions/userLambda/errors'

const config = {
  endpoint: 'http://localhost:8000',
  region: 'local-env',
}

jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDB: jest.fn().mockImplementation(() => ({
    scan: jest.fn().mockImplementation(() =>
      Promise.resolve({
        Items: [{ username: { S: 'any_username' } }],
      })
    ),
  })),
}))

function makeSut() {
  const db = new DynamoDB(config)
  const sut = () => getUsers('test', db)
  return { sut, db }
}

describe('Get users use case', () => {
  it('Should call DynamoDB scan with correct params', async () => {
    const { db, sut } = makeSut()
    const scanSpy = jest.spyOn(db, 'scan')

    await sut()

    expect(scanSpy).toHaveBeenCalledWith({
      TableName: 'test-users',
      ProjectionExpression: 'username',
    })
  })

  it('Should throw an error if no users are found', async () => {
    const { sut, db } = makeSut()
    jest.spyOn(db, 'scan').mockImplementationOnce(() => Promise.resolve({ Items: null }))

    const promise = sut()

    await expect(promise).rejects.toThrow(new NotFoundError('Users not found'))
  })

  it('Should return an array of users', async () => {
    const { sut } = makeSut()

    const users = await sut()

    expect(users).toEqual([{ username: 'any_username' }])
  })
})

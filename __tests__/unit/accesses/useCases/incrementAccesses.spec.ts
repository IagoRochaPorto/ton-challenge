import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { incrementAccesses } from '../../../../functions/accessLambda/useCases'

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
            role: { S: 'accesses' },
            quantity: { N: '12' },
          },
        ],
      })
    ),
    putItem: jest.fn().mockImplementation(() => Promise.resolve(null)),
    updateItem: jest.fn().mockImplementation(() => Promise.resolve(null)),
  })),
}))

function makeSut() {
  const db = new DynamoDB(config)
  const sut = (accesses: number) => incrementAccesses('test', db, accesses)
  return { sut, db }
}

describe('Increment accesses use case', () => {
  it('Should call DynamoDB scan with correct params', async () => {
    const { db, sut } = makeSut()
    const scan = jest.spyOn(db, 'scan')

    await sut(1)

    expect(scan).toHaveBeenCalledWith({
      TableName: 'test-roles',
    })
  })

  it('Should call DynamoDB updateItem with correct params if accesses are found', async () => {
    const { db, sut } = makeSut()
    const updateItemSpy = jest.spyOn(db, 'updateItem')

    await sut(2)

    expect(updateItemSpy).toHaveBeenCalledWith({
      TableName: 'test-roles',
      Key: { role: { S: 'accesses' } },
      UpdateExpression: 'ADD quantity :increment',
      ExpressionAttributeValues: {
        ':increment': { N: '2' },
      },
    })
  })

  it('Should call DynamoDB putItem with correct params if no accesses are found', async () => {
    const { db, sut } = makeSut()
    const putItemSpy = jest.spyOn(db, 'putItem')
    jest.spyOn(db, 'scan').mockImplementationOnce(() => Promise.resolve({ Items: null }))

    await sut(3)

    expect(putItemSpy).toHaveBeenCalledWith({
      TableName: 'test-roles',
      Item: {
        role: { S: 'accesses' },
        quantity: { N: '3' },
      },
    })
  })
})

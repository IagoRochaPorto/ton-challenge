import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { getAccesses } from '../../../../functions/accessLambda/useCases/getAccesses'

const config = {
  endpoint: 'http://localhost:8000',
  region: 'local-env',
}

jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDB: jest.fn().mockImplementation(() => ({
    scan: jest.fn().mockImplementation(() =>
      Promise.resolve({
        Items: [{ quantity: { N: '12' } }],
      })
    ),
  })),
}))

function makeSut() {
  const db = new DynamoDB(config)
  const stage = 'test'
  const sut = () => getAccesses({ stage, db })
  return { sut, db }
}

describe('Get accesses use case', () => {
  beforeAll(async () => {
    console.log('here')
  })
  it('Should call DynamoDB scan with correct params', async () => {
    const { db, sut } = makeSut()
    const scan = jest.spyOn(db, 'scan')

    await sut()

    expect(scan).toHaveBeenCalledWith({
      TableName: `test-flow-control`,
      ProjectionExpression: 'quantity',
      FilterExpression: '#role = :roleName',
      ExpressionAttributeNames: {
        '#role': 'role',
      },
      ExpressionAttributeValues: {
        ':roleName': { S: 'accesses' },
      },
    })
  })

  it('Should return 0 accesses if no accesses are found', async () => {
    const { sut, db } = makeSut()
    jest.spyOn(db, 'scan').mockImplementationOnce(() => Promise.resolve({ Items: null }))

    const accesses = await sut()

    expect(accesses).toEqual({ accesses: 0 })
  })

  it('Should return 0 accesses if no quantity is found', async () => {
    const { sut, db } = makeSut()
    jest.spyOn(db, 'scan').mockImplementationOnce(() => Promise.resolve({ Items: [{}] }))

    const accesses = await sut()

    expect(accesses).toEqual({ accesses: 0 })
  })

  it('Should return an array of accesses', async () => {
    const { sut } = makeSut()

    const accesses = await sut()

    expect(accesses).toEqual({ accesses: 12 })
  })
})

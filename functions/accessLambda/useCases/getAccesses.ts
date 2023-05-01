import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { BadRequestError } from '../errors'

export async function getAccesses(stage: string, db: DynamoDB) {
  const { Items: accesses } = await db.scan({
    TableName: `${stage}-roles`,
    ProjectionExpression: 'quantity',
    FilterExpression: '#role = :roleName',
    ExpressionAttributeNames: {
      '#role': 'role',
    },
    ExpressionAttributeValues: {
      ':roleName': { S: 'accesses' },
    },
  })

  if (!accesses?.length) {
    return { accesses: 0 }
  }

  const access = accesses[0]

  if (!access.quantity?.N) {
    return { accesses: 0 }
  }

  return {
    accesses: parseInt(access.quantity.N),
  }
}

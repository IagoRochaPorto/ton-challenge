import { DynamoDB } from '@aws-sdk/client-dynamodb'

type GetAccessesParams = {
  stage: string
  db: DynamoDB
}

export async function getAccesses(params: GetAccessesParams) {
  const { db, stage } = params
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

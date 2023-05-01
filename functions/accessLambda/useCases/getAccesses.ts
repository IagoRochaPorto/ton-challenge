import { DynamoDB } from '@aws-sdk/client-dynamodb'

export async function getAccesses(stage: string, db: DynamoDB) {
  const { Item: access } = await db.getItem({
    TableName: `${stage}-accesses`,
    Key: { role: { S: 'accesses' } },
  })

  if (!access?.quantity) {
    return { accesses: 0 }
  }

  return {
    accesses: access.quantity.N,
  }
}

import { DynamoDB } from '@aws-sdk/client-dynamodb'

export async function incrementAccesses(stage: string, db: DynamoDB, increment: number) {
  const { Item: access } = await db.getItem({
    TableName: `${stage}-accesses`,
    Key: { role: { S: 'accesses' } },
  })

  if (!access) {
    await db.putItem({
      TableName: `${stage}-accesses`,
      Item: {
        role: { S: 'accesses' },
        quantity: { N: increment.toString() },
      },
    })
  } else {
    await db.updateItem({
      TableName: `${stage}-accesses`,
      Key: { role: { S: 'accesses' } },
      UpdateExpression: 'ADD quantity :increment',
      ExpressionAttributeValues: {
        ':increment': { N: increment.toString() },
      },
    })
  }
}

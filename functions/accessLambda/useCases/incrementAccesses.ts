import { DynamoDB } from '@aws-sdk/client-dynamodb'

export async function incrementAccesses(stage: string, db: DynamoDB, increment: number) {
  const { Items } = await db.scan({ TableName: `${stage}-roles` })
  const accessDocument = Items?.find((item) => item.role.S === 'accesses')
  const accessAlreadyExists = !!accessDocument?.role?.S

  if (!accessAlreadyExists) {
    await db.putItem({
      TableName: `${stage}-roles`,
      Item: {
        role: { S: 'accesses' },
        quantity: { N: increment.toString() },
      },
    })
  } else {
    await db.updateItem({
      TableName: `${stage}-roles`,
      Key: { role: { S: 'accesses' } },
      UpdateExpression: 'ADD quantity :increment',
      ExpressionAttributeValues: {
        ':increment': { N: increment.toString() },
      },
    })
  }

  return { accesses: increment }
}

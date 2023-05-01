import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { APIGatewayEvent, Callback, Context } from 'aws-lambda'
import { BadRequestError, NotFoundError } from './errors'
import { incrementAccesses } from './useCases'
import { getAccesses } from './useCases/getAccesses'

const db = new DynamoDB({
  region: process.env.AWS_CUSTOM_REGION,
  endpoint: process.env.AWS_CUSTOM_ENDPOINT,
})

exports.handler = async function (event: APIGatewayEvent, _context: Context, callback: Callback) {
  try {
    const { requestContext, body } = event
    const { httpMethod, stage } = requestContext

    switch (httpMethod) {
      case 'POST':
        if (!body) {
          throw new BadRequestError('Missing body')
        }
        const parsedBody = JSON.parse(body) as { increment?: number }
        if (!parsedBody.increment) {
          throw new BadRequestError('Missing increment')
        }

        await incrementAccesses(stage, db, parsedBody.increment)
        callback(null, {
          statusCode: 201,
          body: JSON.stringify({ message: 'Accesses incremented' }),
        })
        break
      case 'GET':
        const accesses = await getAccesses(stage, db)
        callback(null, { statusCode: 200, body: JSON.stringify(accesses) })
        break
      default:
        callback(null, { statusCode: 405, body: JSON.stringify({ message: 'Method not allowed' }) })
    }
  } catch (error) {
    if (error instanceof BadRequestError) {
      callback(null, { statusCode: 400, body: JSON.stringify({ message: error.message }) })
      return
    }

    if (error instanceof NotFoundError) {
      callback(null, { statusCode: 404, body: JSON.stringify({ message: error.message }) })
      return
    }

    callback(error, { statusCode: 500, body: JSON.stringify({ message: 'Internal server error' }) })
  }
}

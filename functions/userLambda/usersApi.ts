import { APIGatewayEvent, Context, Callback } from 'aws-lambda'
import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { addUser, authUser, getUsers } from './useCases'
import { BadRequestError, NotFoundError, UnauthorizedError } from './errors'
import { User } from './user'

const db = new DynamoDB({
  region: process.env.AWS_CUSTOM_REGION,
  endpoint: process.env.AWS_CUSTOM_ENDPOINT,
})

exports.handler = async function (event: APIGatewayEvent, _context: Context, callback: Callback) {
  try {
    const { requestContext, body, queryStringParameters } = event
    const { httpMethod, stage, path } = requestContext

    switch (httpMethod) {
      case 'POST':
        if (!body) {
          throw new BadRequestError('Missing body')
        }
        const parsedBody = JSON.parse(body) as Partial<User>

        if (path.endsWith('/auth')) {
          const user = {
            username: parsedBody.username,
            password: parsedBody?.password,
          }
          const authenticatedUser = await authUser({ stage, db, user })
          callback(null, { statusCode: 200, body: JSON.stringify(authenticatedUser) })
          return
        }
        if (path.endsWith('/user')) {
          const parsedUser = {
            email: parsedBody.email,
            username: parsedBody.username,
            password: parsedBody.password,
          }
          const createdUser = await addUser({ stage, db, user: parsedUser })
          callback(null, { statusCode: 201, body: JSON.stringify(createdUser) })
          return
        }
        break

      case 'GET':
        const users = await getUsers({ stage, db })
        callback(null, { statusCode: 200, body: JSON.stringify({ users }) })
        return
      default:
        callback(null, { statusCode: 200, body: JSON.stringify({ teste: 'a' }) })
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

    if (error instanceof UnauthorizedError) {
      callback(null, { statusCode: 401, body: JSON.stringify({ message: error.message }) })
      return
    }

    callback(null, { statusCode: 500, body: JSON.stringify({ message: 'Internal server error' }) })
  }
}

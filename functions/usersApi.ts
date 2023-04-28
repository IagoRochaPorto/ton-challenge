import { APIGatewayEvent, Context } from 'aws-lambda'

exports.handler = async function handler(event: APIGatewayEvent, context: Context) {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'My first lambda function!', fnName: context.functionName, params: event.queryStringParameters })
  }
}

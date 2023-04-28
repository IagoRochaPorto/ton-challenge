import { APIGatewayEvent, Context, Callback } from "aws-lambda";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { getUsers } from "./helpers";

const db = new DynamoDB({ region: "us-east-1" });

exports.handler = async function (
  event: APIGatewayEvent,
  context: Context,
  callback: Callback
) {
  try {
    const { httpMethod: method, stage } = event.requestContext;

    if (method === "GET") {
      const users = await getUsers(stage, db);
      return {
        statusCode: 200,
        body: JSON.stringify(users),
      };
    }

    return {
      statusCode: 404,
      body: JSON.stringify({ message: "Not Found" }),
    };
  } catch (error) {
    console.log(error);
  }
};

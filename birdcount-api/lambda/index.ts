import {
  Handler,
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";

import dynamodb from "./dynamodb";
import authenticator from "./authenticator";

import { BatchWriteItemCommand } from "@aws-sdk/client-dynamodb";
type ProxyHandler = Handler<APIGatewayProxyEventV2, APIGatewayProxyResultV2>;

const awsConfig = {
  region: "us-east-1",
};

const authenticate = authenticator(awsConfig);

function createObservations(input) {
  const timestamp = new Date().getTime();

  let error = "";
  const ret = input.map((i) => ({
    group: i.group,
    timestamp,
    id: i.id,
    user: i.user,
    count: i.count,
  }));

  return [ret, error];
}

async function addObservations(event, context) {
  const data = JSON.parse(event.body); // try/catch

  const [items, error] = createObservations(data);

  if (error) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "text/plain" },
      body: error,
    };
  }

  const table = process.env.DYNAMODB_TABLE as string;

  let params: any = {
    RequestItems: {},
  };

  const requests = items.map((i) => ({
    PutRequest: {
      Item: {
        group: { S: i.group },
        timestamp: { N: `${i.timestamp}` },
        id: { S: i.id },
        user: { S: i.user },
        count: { N: `${i.count}` },
      },
    },
  }));

  params.RequestItems[table] = requests;

  while (Object.keys(params).length > 0) {
    const command = new BatchWriteItemCommand(params);
    const result = await dynamodb.send(command);
    params = result.UnprocessedItems;
  }

  return {
    statusCode: 200,
    body: JSON.stringify(items),
  };
}

export const handler: ProxyHandler = async (event, context) => {
  const authHeader = event.headers.Authorization;
  if (!authHeader) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "No Authorization",
      }),
    };
  }
  const token = authHeader.replace(/^Bearer\s+/, "");
  try {
    const auth = await authenticator(token);
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: e.toString(),
      }),
    };
  }

  //const auth = authenticate("eyJ0eXAiOiJqd3QiLCJhbGciOiJSUzI1NiIsImtpZCI6ImR6NzN3eHp5bmFab3d3czhoRnVXWThheWkyWDVDdTNvQmJ3Njl6dW9rV0kifQ.eyJpc3MiOiJiaXJkY291bnQtYXBpIiwiaWF0IjoxNjc5MjgwNDE4LCJleHAiOjE2NzkyODQwMTgsInN1YiI6InRlc3QifQ.ZyUMv6itqZR0Sl0y1qugLWcxazwOGqTHHZTMVFnNbDog4X1i3cUcvVOA_JTFYS5wmjvXDMw1F4RPg70tWkpW0IrL6fIxHvPQdC-LVnXZZKoxYOVNIsXDlHMv6zvoMN2kU98-9s8H2diFSXVvC22mymuYiSpNTbzROyi5-bMocAtY_kN_3pqI7oMaj_gafBGf1WFqaHwRGRwzEg3mATry5LnohK71pxrb9uYrgm6R3E_QOgIjePnw0BxX3cPNcG37EwRQgK6laLWTvdQ3hl6aRkretoe2Q789BN4s3Y0oxQW3cRf0vBwGDsjXVYCytL2-9tbrumuEjEM418tPZgWjog");
  switch (event.requestContext.http.method) {
    case "POST":
      return await addObservations(event, context);
    default:
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Unsupported method",
        }),
      };
  }
};

import {
  Handler,
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";
import KSUID from "ksuid";

import dynamodb from "./dynamodb";

import { BatchWriteItemCommand } from "@aws-sdk/client-dynamodb";
type ProxyHandler = Handler<APIGatewayProxyEventV2, APIGatewayProxyResultV2>;

const awsConfig = {
  region: "us-east-1",
};


function createObservations(input) {
  const timestamp = new Date();

  let error = "";
  const ret = input.map((i) => ({
    group: i.group,
    ksuid: KSUID.randomSync(timestamp),
    id: i.id,
    user: i.user,
    count: i.count,
  }));

  return [ret, error];
}

async function addObservations(event, context) {
  const data = JSON.parse(event.body); // try/catch

  const [items, error] = createObservations(data.observations);

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
        ksuid: { S: i.ksuid },
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

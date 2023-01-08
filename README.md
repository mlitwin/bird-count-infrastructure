
#



## Install

### Serverless

https://www.serverless.com/framework/docs/getting-started

###

`npm install`



### Local DynamoDB

`cd local`
`docker-compose up -d`
Then `http://localhost:8000/` for admin


## Development


### Run service offline

```bash
serverless offline start
```

```bash
serverless dynamodb migrate # this imports schema
```

```bash
curl -X POST -H "Content-Type:application/json" http://localhost:3000/dev/observations --data '{ "text": "Learn Serverless" }'
```


### Docs

https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb







----

  runtime: nodejs18.x
  frameworkVersion: '3'



##
https://github.com/serverless/examples/blob/v3/aws-node-simple-http-endpoint/serverless.yml

https://github.com/serverless/examples/blob/v3/aws-node-rest-api-with-dynamodb-and-offline/serverless.yml






serverless install -u https://github.com/serverless/examples/tree/v3/aws-node-simple-http-endpoint -n simple-example



serverless install -u https://github.com/serverless/examples/tree/v3/aws-node-rest-api-with-dynamodb-and-offline -n dynamodb-example



	
 # serverless.yml
    service: usersCrud
    provider: aws
    functions:
    # Your Serverless function definitions go here.
    resources: # CloudFormation template syntax from here on.
      Resources:
        usersTable:
          Type: AWS::DynamoDB::Table
          Properties:
            TableName: usersTable
            AttributeDefinitions:
              - AttributeName: email
                AttributeType: S
            KeySchema:
              - AttributeName: email
                KeyType: HASH
            ProvisionedThroughput:
              ReadCapacityUnits: 1
              WriteCapacityUnits: 1
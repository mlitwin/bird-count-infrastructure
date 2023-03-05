'use strict'

const {
    DynamoDBClient,
    BatchExecuteStatementCommand,
} = require('@aws-sdk/client-dynamodb')

let options = {}

// connect to local DB if running offline
if (process.env.IS_OFFLINE) {
    options = {
        region: 'localhost',
        endpoint: 'http://localhost:8000',
    }
}

const dynamodb = new DynamoDBClient(options)

export default dynamodb

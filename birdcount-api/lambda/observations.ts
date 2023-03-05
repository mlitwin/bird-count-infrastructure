'use strict'

const uuid = require('uuid')
import dynamodb from './dynamodb'

import {
    BatchWriteItemCommand,
    
} from '@aws-sdk/client-dynamodb'

function createObservations(input) {
    const timestamp = new Date().getTime()

    let error = ""
    const ret = input.map((i) => ({
        id: i.id,
        user: i.user,
        count: i.count,
        timestamp
    }))

    return [ret, error]
}

async function addObservations(event, context) {
    const data = JSON.parse(event.body) // try/catch

    const [items, error] = createObservations(data)

    if (error) {
        return({
            statusCode: 400,
            headers: { 'Content-Type': 'text/plain' },
            body: error,
        })
    }


    const table = process.env.DYNAMODB_TABLE as string

    let params: any = {
        RequestItems: {
        },
    }

    const requests = items.map(i => ({
        PutRequest: {
            Item: {
                id: { S: i.id},
                timestamp: { N: i.timestamp},
            },
        },
    }))

    params.RequestItems[ table] = requests;

    while(Object.keys(params).length > 0) {
        const command = new BatchWriteItemCommand(params)
        const result = await dynamodb.send(command)
        params = result.UnprocessedItems
    }

        
    return {
        statusCode: 200,
        body: JSON.stringify(items),
    }
    
}

module.exports.observations = async function(event, context) {
    switch (event.requestContext.http.method) {
        case 'POST':
            return await addObservations(event, context)
    }
}

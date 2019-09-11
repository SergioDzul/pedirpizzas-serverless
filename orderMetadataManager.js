'use strict';

const AWS = require('aws-sdk'); // the aws-sdk library is by default installed in the lambda container, for local test please install with: npm install aws-sdk
// read the full documentation of AWS-SDK for node in: https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/index.html
const dynamo = new AWS.DynamoDB.DocumentClient(); // Docs:  https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html



/* reference only. Schema structure for each item in the table.
 order : {
  orderId: String,
  name: String,
  address: String,
  pizzas: Array of Strings,
  delivery_status: READY_FOR_DELIVERY / DELIVERED
  timestamp: timestamp
}
*/

/*
body form postman request.
{
	"name": "Sergio",
	"address": "Some place",
	"pizzas": ["margarita", "tropical"]
}
 */

/**
 * Method used to storage the order object in DynamoDB
 * @param order :Json
 * @returns :Promise
 */
module.exports.saveCompletedOrder = order => {
    console.log('Guardar un pedido fue llamado');

    order.delivery_status = 'READY_FOR_DELIVERY';

    const params = {
        TableName: process.env.COMPLETED_ORDER_TABLE, // defined in the YML file
        Item: order
    };

    // the next line save the item in owe Data base, we return a promise for a better control.
    return dynamo.put(params).promise();
};


/**
 *
 * @param orderId :String
 * @returns {PromiseLike<T> | Promise<T>}
 */
module.exports.deliverOrder = orderId => {
    console.log('Enviar una orden fue llamado');

    const params = {
        TableName: process.env.COMPLETED_ORDER_TABLE, // defined in the YML file
        Key: {
            orderId
        },
        ConditionExpression: 'attribute_exists(orderId)', // required, other ways the update aren't accomplished
        UpdateExpression: 'set delivery_status = :v', // Update query
        ExpressionAttributeValues: {
            ':v': 'DELIVERED' // new value
        },
        ReturnValues: 'ALL_NEW' // we expect to return all new values.
    };

    // execute the update query using the client
    return dynamo
        .update(params)
        .promise()
        .then(response => {
            console.log('order delivered');
            return response.Attributes;
        });
};

module.exports.getOrder = orderId => {
    console.log('El metodo obtener una orden fue llamado');

    const kwards = {
        TableName: process.env.COMPLETED_ORDER_TABLE, // defined in the YML file
        Key: {
            orderId
        }
    };

    return dynamo
        .get(kwards)
        .promise()
        .then(item => {
            console.log(item);
            return item.Item;
        });
};
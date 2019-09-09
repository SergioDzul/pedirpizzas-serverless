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
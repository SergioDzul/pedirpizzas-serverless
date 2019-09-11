'use strict';

const uuidv1 = require('uuid/v1'); // library of node,Simple, fast generation of RFC4122 UUIDS. Check: https://github.com/kelektiv/node-uuid
const AWS = require('aws-sdk'); // the aws-sdk library is by default installed in the lambda container, for local test please install with: npm install aws-sdk
// read the full documentation of AWS-SDK for node in: https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/index.html

const orderMetadataManager = require('./orderMetadataManager'); // we separate the DB functions.

// create a SQS object searching in the region of stage, established in out YML file
let sqs = new AWS.SQS({ region: process.env.REGION}); // to access to environment variable use process.env.NAME_IN_YML_FILE
const QUEUE_URL = process.env.PENDING_ORDER_QUEUE; // get the queue url of the resource created.

module.exports.hacerPedido = (event, context, callback) => {
    console.log("HacerPedido fue llamada.");

    const orderId = uuidv1(); // generar a UUID
    const request = JSON.parse(event.body); // get the POST parameters of the request

    const order = { // create the order structure
        orderId : orderId,
        name: request.name,
        address: request.address,
        pizzas: request.pizzas,
        timestamp: Date.now()
    };

    const params = {
        MessageBody: JSON.stringify(order),
        QueueUrl: QUEUE_URL
    };

    // add message to QUEUE
    // for more details read the docs: https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SQS.html
    sqs.sendMessage(params, (erro, data)=>{
        if(erro){
            sendResponse(500, erro, callback);
        } else {
            const message = {
                order: order,
                messageId: data.MessageId
            };
            sendResponse(200, message, callback)
        }
    });
};


module.exports.prepararPedido = (event, context, callback) => {
    console.log("PerprarPedido fue llamada");
    console.log(event);
    console.log(event.Records);
    console.log(context);

    // remember, this lambda is executed by a Queue add event and we config
    // to execute with a batchSize of 1. In the case of the batchSize are for example 5,
    // Records[] contain 5 elements an maybe you need a foreach loop.
    const order = JSON.parse(event.Records[0].body); // Records[0] because always the length is 1 for this case.

    orderMetadataManager
        .saveCompletedOrder(order)
        .then(data => {
            // success case.
            callback();
        })
        .catch(error => {
            callback(error);
        });
};

module.exports.enviarPedido = (event, context, callback) => {
    console.log("enviarPedido fue llamada");

    // remember, this lambda is executed by a DynamoDB stream add event and we config
    // to execute with a batchSize of 1. In the case of the batchSize are for example 5,
    // Records[] contain 5 elements an maybe you need a foreach loop.
    const record = event.Records[0];
    // need to check if is a insert event in the database.
    if (record.eventName === 'INSERT') {
        console.log('deliverOrder');

        // The record also contain the item storage in the database, the next line have a example of how to take some
        // attribute, the "S" attribute is the type in de DB definition, check the serverless.yml: 103
        const orderId = record.dynamodb.Keys.orderId.S;

        orderMetadataManager
            .deliverOrder(orderId) // deliverOrder is a method defined in orderMetadataManager.js
            .then(data => {
                console.log(data);
                callback();
            })
            .catch(error => {
                callback(error);
            });
    } else {
        console.log('is not a new record');
        callback();
    }
};

module.exports.estadoPedido = (event, context, callback) => {
    console.log('Estado pedido fue llamado');
    // to take the orderId included in the url, first check if pathParameters have elements and later take the parameter.
    const orderId = event.pathParameters && event.pathParameters.orderId;
    if (orderId !== null) {
        orderMetadataManager
            .getOrder(orderId) // is a method defined in orderMetadataManager.js
            .then(order => {
                // to aggregate some variable in a string use ` to define the string and the variable need to be between ${}
                sendResponse(200, `El estado de la orden: ${orderId} es ${order.delivery_status}`, callback);
            })
            .catch(error => {
                sendResponse(500, 'Hubo un error al procesar el pedido', callback);
            });
    } else {
        sendResponse(400, 'Falta el orderId', callback);
    }
};


/**
 * Method used to make a standard response
 * @param statusCode Integer : e.g. 200 ,500, 403
 * @param message String: Response text
 * @param callback Function: the same callback of the lambda function, see L:21
 */
function sendResponse(statusCode, message, callback) {
    const response = {
        statusCode: statusCode,
        body: JSON.stringify(message)
    };

    callback(null, response)
}

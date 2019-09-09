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

    try{
        const order = { // create the order structure
            orderId : orderId,
            name: request.name,
            address: request.address,
            pizzas: request.pizzas,
            timestamp: Date.now()
        };
    } catch (e) {
        sendResponse(500, e.message, callback);
        return;
    }

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
    // to execute with a batchSize if 1. In the case of the batchSize are for example 5
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

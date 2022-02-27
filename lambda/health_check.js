console.log('Loading function');
const AWS = require('aws-sdk');

exports.handler = function(event, context, callback) {
  const response = { 
    status: "Healthy",
    date: new Date().getUTCString()
  }
  callback(null,{ 
    "isBase64Encoded": false,
    "statusCode": 200,
    "headers": {
        "Content-Type": "application/json", 
        "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
        "Access-Control-Allow-Origin": "*"
    }, 
    "body": JSON.stringify(response)
  });
}
const AWS = require('aws-sdk');
const { parseJwt, goodResponse, internalServerErrorResponse } = require('./utils');

const dynamo = new AWS.DynamoDB({apiVersion: '2012-08-10'});

exports.handler = function(event, context, callback) {
  console.log('Received event:', JSON.stringify(event, null, 2));
  console.log('Received context: ', JSON.stringify(context, null, 2));
  
  const plansTable = process.env.PLANS_TABLE_NAME;
  const keysTable = process.env.KEYS_TABLE_NAME;
  
  const httpMethod = event.httpMethod; // e.g. "GET"
  const path = event.path;  // e.g. "/admin/plans/123456
  const resource = event.resource;  // e.g. "/admin/plans/{id}
  const token = event.headers.Authorization.replace(/^[Bb]earer\s+/,'').trim();
  
  if (!plansTable || !keysTable || !path || !resource || !httpMethod || !token ) { 
    console.error(`HTTP 500: Precondition Fail: '${httpMethod}' '${path}' '${resource}' '${plansTable}' '${keysTable}' token.len=${token.len} `);
    callback(null,internalServerErrorResponse());
    return;
  }
  const jwt = parseJwt(token)
  console.log('JWT payload: ', JSON.stringify(jwt, null, 2));
  
  const key = JSON.parse(event.body);
  const rand = event.requestContext.requestId; 
  getKeyById(keysTable, event.pathParameters.id, jwt, callback); 
}

/**
 * GET /admin/keys/{id}
 */
 function getKeyById(tableName, id, jwt, callback) {    
  dynamo.getItem({
      TableName: tableName,
      Key:{
          "id": {
              S: id
          }
      }
  })
  .promise().then((data)=>{
      console.log("Dynamo data: ",JSON.stringify(data.Item, null, 2));
      if (data.Item.owner.S !== jwt.sub) { 
          throw Error("Not Found");
      } 
      const response = goodResponse(JSON.stringify(AWS.DynamoDB.Converter.unmarshall(data.Item)));
      callback(null,response);
  })
  .catch((err)=>{
      console.error("HTTP 500: Dynamo responded: ", JSON.stringify(err, null, 2));
      callback(null,internalServerErrorResponse());
  });

}

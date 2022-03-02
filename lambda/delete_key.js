const AWS = require("aws-sdk");

const { findPoolForPlanId } = require("./api_key_pools");

const {
  parseJwt,
  goodResponse,
  internalServerErrorResponse,
} = require("./utils");

const dynamo = new AWS.DynamoDB({ apiVersion: "2012-08-10" });
var apigateway = new AWS.APIGateway({ apiVersion: "2015-07-09" });

exports.handler = function (event, context, callback) {
  console.log("Received event:", JSON.stringify(event, null, 2));
  console.log("Received context: ", JSON.stringify(context, null, 2));

  const plansTable = process.env.PLANS_TABLE_NAME;
  const keysTable = process.env.KEYS_TABLE_NAME;

  const httpMethod = event.httpMethod; // e.g. "GET"
  const path = event.path; // e.g. "/admin/plans/123456
  const resource = event.resource; // e.g. "/admin/plans/{id}
  const token = event.headers.Authorization.replace(/^[Bb]earer\s+/, "").trim();

  callback(null, goodResponse("YES"));

  if (
    !plansTable ||
    !keysTable ||
    !path ||
    !resource ||
    !httpMethod ||
    !token
  ) {
    console.error(
      `HTTP 500: Precondition Fail: '${httpMethod}' '${path}' '${resource}' '${plansTable}' '${keysTable}' token.len=${token.len} `
    );
    callback(null, internalServerErrorResponse());
    return;
  }
  const jwt = parseJwt(token);
  console.log("JWT payload: ", JSON.stringify(jwt, null, 2));

  deleteKeyById(keysTable, event.pathParameters.id, jwt, callback);
};

/**
* DELETE /admin/keys/{id}
*/
function deleteKeyById(tableName, id, jwt, callback) {

  dynamo
    .getItem({
      TableName: tableName,
      Key: {
        id: {
          S: id,
        },
      },
    })
    .promise()
    .then((data) => {
      console.log("DynamoFind ", JSON.stringify(data, 0, 2))
      // store the usagePlanId for later
      const usagePlanId = data.Item.planId.S;

      const pool = findPoolForPlanId(usagePlanId);
      
      if (!pool) { 
        deleteSiloedKeyById(tableName, id, usagePlanId, jwt, callback);
      } else {
        deletePooledKeyById(tableName, id, pool, jwt, callback);
      } 
    });
}

/**
 * DELETE /admin/keys/{id}
 */
function deleteSiloedKeyById(tableName, id, usagePlanId, jwt, callback) {
  console.log("Delete Siloed Key ", id, usagePlanId);

  dynamo
        .deleteItem({
          TableName: tableName,
          Key: {
            id: {
              S: id,
            },
          },
          // ConditionExpression: "#owner = :o",
          // ExpressionAttributeNames: {
          //   "#owner": "owner",
          // },
          // ExpressionAttributeValues: {
          //   ":o": {
          //     S: jwt.sub,
          //   },
          // },
        })
        .promise()
    .then((data) => {
      console.log("Dynamo delete: ", JSON.stringify(data, null, 2));
      return apigateway
        .deleteUsagePlanKey({
          keyId: id,
          usagePlanId: usagePlanId,
        })
        .promise();
    })
    .then((data) => {
      console.log("APIGW DeleteUsageKey Result: ", JSON.stringify(data, null, 2));
      return apigateway
        .deleteApiKey({
          apiKey: id,
        })
        .promise();
    })
    .then((data) => {
      console.log("APIGW DeleteApiKey Result: ", JSON.stringify(data, null, 2));
      const response = goodResponse(
        JSON.stringify(AWS.DynamoDB.Converter.unmarshall(data))
      );
      callback(null, response);
    })
    .catch((err) => {
      console.error(
        "HTTP 500: Dynamo responded: ",
        JSON.stringify(err, null, 2)
      );
      callback(null, internalServerErrorResponse());
    });
}

// This deletes the tenant-specific entry in DynamoDB, but does not
// delete the pooled ApiKey
function deletePooledKeyById(tableName, id, pool, jwt, callback) {
  console.log("Delete Pooled Key", id, JSON.stringify(pool,0,2));
  
  dynamo
    .deleteItem({
      TableName: tableName,
      Key: {
        id: {
          S: id,
        },
      },
      // ConditionExpression: "#owner = :o",
      // ExpressionAttributeNames: {
      //   "#owner": "owner",
      // },
      // ExpressionAttributeValues: {
      //   ":o": {
      //     S: jwt.sub,
      //   },
      // },
    })
    .promise()
    .then((data) => {
      console.log("Dynamo data: ", JSON.stringify(data, null, 2));
      const response = goodResponse(
        JSON.stringify(AWS.DynamoDB.Converter.unmarshall(data))
      );
      callback(null, response);
    })
    .catch((err) => {
      console.error(
        "HTTP 500: Dynamo responded: ",
        JSON.stringify(err, null, 2)
      );
      callback(null, internalServerErrorResponse());
    });
}

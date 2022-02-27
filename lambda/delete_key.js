const AWS = require("aws-sdk");
const pools = require("./api_key_pools");
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
  // search and see if the id is in any of the pools.
  const allApiKeyIds = pools.apiKeyPools.flatMap((plan) => plan.apiKeys);

  const found = allApiKeyIds.find((apiKeyId) => apiKeyId === id);

  if (found) {
    deleteSiloedKeyById(tableName, id, jwt, callback);
  } else {
    deletePooledKeyById(tableName, id, jwt, callback);
  }
}

/**
 * DELETE /admin/keys/{id}
 */
function deleteSiloedKeyById(tableName, id, jwt, callback) {
  dynamo
    .deleteItem({
      TableName: tableName,
      Key: {
        id: {
          S: id,
        },
      },
      ConditionExpression: "#owner = :o",
      ExpressionAttributeNames: {
        "#owner": "owner",
      },
      ExpressionAttributeValues: {
        ":o": {
          S: jwt.sub,
        },
      },
    })
    .promise()
    .then((data) => {
      return apigateway.deleteApiKey({
        apiKey: id,
      });
    })
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

// This deletes the tenant-specific entry in DynamoDB, but does not
// delete the pooled ApiKey
function deletePooledKeyById(tableName, id, jwt, callback) {
  dynamo
    .deleteItem({
      TableName: tableName,
      Key: {
        id: {
          S: id,
        },
      },
      ConditionExpression: "#owner = :o",
      ExpressionAttributeNames: {
        "#owner": "owner",
      },
      ExpressionAttributeValues: {
        ":o": {
          S: jwt.sub,
        },
      },
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

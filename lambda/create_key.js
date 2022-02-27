const AWS = require("aws-sdk");
const pools = require("./api_key_pools");

const {
  parseJwt,
  goodResponse,
  internalServerErrorResponse,
  makeid,
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

  const key = JSON.parse(event.body);
  const rand = event.requestContext.requestId;
  createKey(keysTable, key, plansTable, jwt, rand, callback);
};

/**
 * POST /admin/keys
 */
function createKey(tableName, key, plansTable, jwt, rand, callback) {
  const pool = pools.apiKeyPools.find((item) => item.planId === key.planId);

  if (!pool) {
    createSiloedKey(tableName, key, plansTable, jwt, rand, callback);
  } else {
    createPooledKey(pool, tableName, key, jwt, callback);
  }
}

/**
 * POST /admin/keys
 */
function createSiloedKey(tableName, key, plansTable, jwt, rand, callback) {
  var apiKeyId = undefined;

  // first make sure we have a valid plan ID
  dynamo
    .getItem({
      TableName: plansTable,
      Key: {
        id: {
          S: key.planId,
        },
      },
    })
    .promise()
    .then((data) => {
      console.log("Found matching plan: ", data);
      // create an API key
      return apigateway
        .createApiKey({
          name: key.name,
          description: key.description,
          enabled: key.enabled,
          tags: { ownerId: jwt.sub },
          value: rand,
        })
        .promise();
    })
    .then((apiKey) => {
      console.log("APIGateway created APIKey: ", apiKey);
      apiKeyId = apiKey.id;
      return apigateway
        .createUsagePlanKey({
          keyId: apiKey.id,
          keyType: "API_KEY",
          usagePlanId: key.planId,
        })
        .promise();
    })
    .then((data) => {
      console.log("APIGateway regsitered key with usage plan ", data);
      // now save do our database.
      return dynamo
        .putItem({
          TableName: tableName,
          Item: {
            id: { S: apiKeyId },
            planId: { S: key.planId },
            name: { S: key.name },
            description: { S: key.description },
            enabled: { BOOL: key.enabled },
            owner: { S: jwt.sub },
            value: { S: rand },
          },
        })
        .promise();
    })
    .then((data) => {
      console.log("Dynamo data: ", JSON.stringify(data.Item, null, 2));
      const response = goodResponse(
        JSON.stringify(AWS.DynamoDB.Converter.unmarshall(data.Item))
      );
      callback(null, response);
    })
    .catch((reason) => {
      console.error(reason);
      callback(null, internalServerErrorResponse());
    });
}

function createPooledKey(pool, tableName, key, jwt, callback) {
  // first, choose a key from the pool.
  // a more sophisticated implementation would balance the load,
  // but for demo purposes, random suffices.
  var randomKey = pool.apiKeys[Math.floor(Math.random() * pool.apiKeys.length)]; // note a production system can do much better than random.
  // first make sure we have a valid key ID

  dynamo
    .getItem({
      TableName: tableName,
      Key: {
        id: {
          S: randomKey,
        },
      },
    })
    .promise()
    .then((data) => {
      const newId = makeid(8);
      return dynamo
        .putItem({
          TableName: tableName,
          Item: {
            id: { S: randomKey },
            planId: { S: key.planId },
            name: { S: key.name },
            description: { S: key.description },
            enabled: { BOOL: key.enabled },
            owner: { S: jwt.sub },
            value: key.value,
          },
        })
        .promise();
    })
    .then((data) => {
      console.log("Dynamo data: ", JSON.stringify(data.Item, null, 2));
      const response = goodResponse(
        JSON.stringify(AWS.DynamoDB.Converter.unmarshall(data.Item))
      );
      callback(null, response);
    })
    .catch((reason) => {
      console.error(reason);
      callback(null, internalServerErrorResponse());
    });
}

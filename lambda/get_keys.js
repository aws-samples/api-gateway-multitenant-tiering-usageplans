const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const {
	parseJwt,
	goodResponse,
	internalServerErrorResponse,
} = require('./utils');

const dynamoClient = new DynamoDBClient({ region: 'eu-north-1' }); // replace 'REGION' with your AWS region

exports.handler = async function (event) {
	console.log('Received event:', JSON.stringify(event, null, 2));

	const plansTable = process.env.PLANS_TABLE_NAME;
	const keysTable = process.env.KEYS_TABLE_NAME;

	const httpMethod = event.httpMethod; // e.g. "GET"
	const path = event.path; // e.g. "/admin/plans/123456
	const resource = event.resource; // e.g. "/admin/plans/{id}
	if (!event.headers || !event.headers.Authorization) {
		console.error('HTTP 500: Authorization header missing');
		return internalServerErrorResponse();
	}

	const token = event.headers.Authorization.split(' ')[1];

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
		return internalServerErrorResponse();
	}
	const jwt = parseJwt(token);
	console.log('JWT payload: ', JSON.stringify(jwt, null, 2));

	try {
		const response = await getKeys(keysTable, jwt);
		return response;
	} catch (err) {
		console.error('HTTP 500: Dynamo responded: ', JSON.stringify(err, null, 2));
		return internalServerErrorResponse();
	}
};

/**
 * GET /admin/keys
 */
async function getKeys(tableName, jwt) {
	const command = new ScanCommand({
		TableName: tableName,
		FilterExpression: '#owner = :o',
		ExpressionAttributeNames: {
			'#owner': 'owner',
		},
		ExpressionAttributeValues: {
			':o': {
				S: jwt.sub,
			},
		},
	});

	const data = await dynamoClient.send(command);
	console.log('Dynamo data: ', JSON.stringify(data.Items, null, 2));
	const response = goodResponse(JSON.stringify(data.Items));
	return response;
}

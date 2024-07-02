/**
 * Given a JWT Token (sans 'Bearer prefix'), return JSON of the data inside
 * NOTE: does not cryptographically validate the token. That is assumed upstream.
 */
exports.parseJwt = (token) => {
	const base64Url = token.split('.')[1];
	const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
	const jsonPayload = decodeURIComponent(
		Buffer.from(base64, 'base64')
			.toString()
			.split('')
			.map(function (c) {
				return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
			})
			.join('')
	);

	return JSON.parse(jsonPayload);
};

/**
 * HTTP 200 OK response
 */
exports.goodResponse = (body) => {
	return {
		statusCode: 200,
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Headers':
				'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
			'Access-Control-Allow-Methods': '*',
			'Access-Control-Allow-Origin': '*',
		},
		isBase64Encoded: false,
		body: body,
	};
};

/**
 * HTTP 500 Internal Server Error
 */
exports.internalServerErrorResponse = () => {
	return {
		statusCode: 500,
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Headers':
				'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
			'Access-Control-Allow-Origin': '*',
		},
		isBase64Encoded: false,
		body: 'Internal Server Error',
	};
};

exports.makeid = (length) => {
	var result = '';
	var characters =
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	var charactersLength = characters.length;
	for (var i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
};

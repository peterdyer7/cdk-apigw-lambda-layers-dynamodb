const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME || '';
const PARTITION_KEY = process.env.PARTITION_KEY || '';

export const handler = async function(event: any = {}): Promise<any> {
  const reqItemId = event.pathParameters.id;
  if (!reqItemId) {
    return {
      statusCode: 400,
      body: `Error: path parameter id missing`
    };
  }

  const params = {
    TableName: TABLE_NAME,
    Key: {
      [PARTITION_KEY]: reqItemId
    }
  };

  try {
    await db.delete(params).promise();
    return {
      statusCode: 204,
      body: ''
    };
  } catch (dbError) {
    return {
      statusCode: 500,
      body: JSON.stringify(dbError)
    };
  }
};

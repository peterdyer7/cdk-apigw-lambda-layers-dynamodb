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
    const res = await db.get(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify(res.Item)
    };
  } catch (dbError) {
    return {
      statusCode: 500,
      body: JSON.stringify(dbError)
    };
  }
};

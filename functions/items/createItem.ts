const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();
const uuidv4 = require('uuid/v4');
const TABLE_NAME = process.env.TABLE_NAME || '';
const PARTITION_KEY = process.env.PARTITION_KEY || '';

export const handler = async function(event: any = {}): Promise<any> {
  if (!event.body) {
    return {
      statusCode: 400,
      body: `Error: request body missing`
    };
  }

  const item =
    typeof event.body == 'object' ? event.body : JSON.parse(event.body);
  item[PARTITION_KEY] = uuidv4();
  const params = {
    TableName: TABLE_NAME,
    Item: item
  };

  try {
    await db.put(params).promise();
    return {
      statusCode: 201,
      body: ''
    };
  } catch (dbError) {
    return {
      statusCode: 500,
      body: JSON.stringify(dbError)
    };
  }
};

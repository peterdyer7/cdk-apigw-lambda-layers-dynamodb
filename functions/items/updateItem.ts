const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME || '';
const PARTITION_KEY = process.env.PARTITION_KEY || '';

// TROUBLESHOOTINGIN REQUIRED, SOMETHING IN HERE DOES NOT WORK

export const handler = async function(event: any = {}): Promise<any> {
  if (!event.body) {
    return {
      statusCode: 400,
      body: `Error: request body missing`
    };
  }

  const itemId = event.pathParameters.id;
  if (!itemId) {
    return {
      statusCode: 400,
      body: `Error: path parameter id missing`
    };
  }

  const item =
    typeof event.body == 'object' ? event.body : JSON.parse(event.body);
  const itemProperties = Object.keys(item);
  if (!item || itemProperties.length < 1) {
    return {
      statusCode: 400,
      body: `Error: no arguments provided`
    };
  }

  const firstProperty = itemProperties.splice(0, 1);

  const params: any = {
    TableName: TABLE_NAME,
    Key: {
      [PARTITION_KEY]: itemId
    },
    UpdataExpression: `set ${firstProperty} = :${firstProperty}`,
    ExpressionAttributeValues: {},
    ReturnValues: 'UPDATED_NEW'
  };
  params.ExpressionAttributeValues[`:${firstProperty}`] =
    item[`${firstProperty}`];

  itemProperties.forEach((property) => {
    params.UpdataExpression += `, ${property} = :${property}`;
    params.ExpressionAttributeValues[`${property}`] = item[property];
  });

  try {
    await db.update(params).promise();
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

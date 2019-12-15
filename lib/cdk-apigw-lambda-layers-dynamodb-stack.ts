import cdk = require('@aws-cdk/core');
import dynamodb = require('@aws-cdk/aws-dynamodb');
import apigw = require('@aws-cdk/aws-apigateway');
import lambda = require('@aws-cdk/aws-lambda');
import iam = require('@aws-cdk/aws-iam');
import { IAuthorizer } from '@aws-cdk/aws-apigateway';

export class CdkApigwLambdaLayersDynamodbStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // config data - apiUrl is picked up after api is created
    const envi = {
      aws_region: 'us-east-1',
      apiUrl: '',
      deployStage: 'test'
    };

    // DynamoDB Table: saas-items
    const dynamoTable = new dynamodb.Table(this, 'items', {
      partitionKey: {
        name: 'itemId',
        type: dynamodb.AttributeType.STRING
      },
      tableName: 'saas-items',
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 1,
      writeCapacity: 1
    });

    // API
    const api = new apigw.RestApi(this, 'SaaSAPI', {
      restApiName: 'SaaS Api',
      deployOptions: {
        stageName: envi.deployStage,
        loggingLevel: apigw.MethodLoggingLevel.INFO
      },
      endpointTypes: [apigw.EndpointType.REGIONAL],
      retainDeployments: true
    });
    envi.apiUrl = `https://${api.restApiId}.execute-api.${envi.aws_region}.amazonaws.com/${envi.deployStage}`;

    // Lambda Layers
    const timeLayer = new lambda.LayerVersion(this, 'timeLayer', {
      code: lambda.Code.asset('layers/time'),
      compatibleRuntimes: [lambda.Runtime.NODEJS_12_X]
    });

    // /health
    const healthRes = api.root.addResource('health');
    const healthLambda = new lambda.Function(this, 'HealthHandler', {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.asset('functions/health'),
      handler: 'health.handler',
      environment: {
        REGION: envi.aws_region,
        API: envi.apiUrl
      },
      layers: [timeLayer]
    });
    const healthInt = new apigw.LambdaIntegration(healthLambda);
    healthRes.addMethod('GET', healthInt);

    // /items
    const itemsRes = api.root.addResource('items');

    // GET /items
    const getAllItemsLambda = new lambda.Function(this, 'GetAllItemsLambdaHandler', {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.asset('functions/items'),
      handler: 'getAllItems.handler',
      environment: {
        TABLE_NAME: dynamoTable.tableName,
        PARTITION_KEY: 'itemId'
      }
    });
    dynamoTable.grantReadWriteData(getAllItemsLambda);
    const getAllItemsInt = new apigw.LambdaIntegration(getAllItemsLambda);
    itemsRes.addMethod('GET', getAllItemsInt);

    // POST /items
    const createItemLambda = new lambda.Function(this, 'CreateItemLambdaHandler', {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.asset('functions/items'),
      handler: 'createItem.handler',
      environment: {
        TABLE_NAME: dynamoTable.tableName,
        PARTITION_KEY: 'itemId'
      }
    });
    dynamoTable.grantReadWriteData(createItemLambda);
    const createItemInt = new apigw.LambdaIntegration(createItemLambda);
    itemsRes.addMethod('POST', createItemInt);

    // /items/{id}
    const singleItemRes = itemsRes.addResource('{id}');

    // GET /items/{id}
    const getOneItemLambda = new lambda.Function(this, 'GetOneItemLambdaHandler', {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.asset('functions/items'),
      handler: 'getOneItem.handler',
      environment: {
        TABLE_NAME: dynamoTable.tableName,
        PARTITION_KEY: 'itemId'
      }
    });
    dynamoTable.grantReadWriteData(getOneItemLambda);
    const getOneItemInt = new apigw.LambdaIntegration(getOneItemLambda);
    singleItemRes.addMethod('GET', getOneItemInt);

    // PATCH /items/{id}
    const updateItemLambda = new lambda.Function(this, 'UpdateItemLambdaHandler', {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.asset('functions/items'),
      handler: 'updateItem.handler',
      environment: {
        TABLE_NAME: dynamoTable.tableName,
        PARTITION_KEY: 'itemId'
      }
    });
    dynamoTable.grantReadWriteData(updateItemLambda);
    const updateItemInt = new apigw.LambdaIntegration(updateItemLambda);
    singleItemRes.addMethod('PATCH', updateItemInt);

    // DELETE /items/{id}
    const deleteItemLambda = new lambda.Function(this, 'DeleteItemLambdaHandler', {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.asset('functions/items'),
      handler: 'deleteItem.handler',
      environment: {
        TABLE_NAME: dynamoTable.tableName,
        PARTITION_KEY: 'itemId'
      }
    });
    dynamoTable.grantReadWriteData(deleteItemLambda);
    const deleteItemInt = new apigw.LambdaIntegration(deleteItemLambda);
    singleItemRes.addMethod('DELETE', deleteItemInt);

    //addCorsOptions(singleItem);
  }
}

export function addCorsOptions(apiResource: apigw.IResource) {
  apiResource.addMethod(
    'OPTIONS',
    new apigw.MockIntegration({
      integrationResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Headers':
              "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
            'method.response.header.Access-Control-Allow-Origin': "'*'",
            'method.response.header.Access-Control-Allow-Credentials': "'false'",
            'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET,PUT,POST,DELETE'"
          }
        }
      ],
      passthroughBehavior: apigw.PassthroughBehavior.NEVER,
      requestTemplates: {
        'application/json': '{"statusCode": 200}'
      }
    }),
    {
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Headers': true,
            'method.response.header.Access-Control-Allow-Methods': true,
            'method.response.header.Access-Control-Allow-Credentials': true,
            'method.response.header.Access-Control-Allow-Origin': true
          }
        }
      ]
    }
  );
}

#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { CdkApigwLambdaLayersDynamodbStack } from '../lib/cdk-apigw-lambda-layers-dynamodb-stack';

const app = new cdk.App();
new CdkApigwLambdaLayersDynamodbStack(app, 'CdkApigwLambdaLayersDynamodbStack');

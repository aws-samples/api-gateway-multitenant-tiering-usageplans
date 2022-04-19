#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ApiStack } from '../lib/api-stack';
import { AuthStack } from '../lib/auth-stack';
import { NagSuppressions, AwsSolutionsChecks } from 'cdk-nag';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION
}
const authStack = new AuthStack(app, 'AuthStack', {env});
const apiStack = new ApiStack(app, 'APIStack', {
  env,
  cognitoUserPoolId: authStack.userPool.userPoolId // replace with react/src/aws-exports.js:aws_user_pools_id
});

if (apiStack.node.tryGetContext('AWS_SOLUTIONS_CHECK')) {
  cdk.Aspects.of(app).add(new AwsSolutionsChecks());
  NagSuppressions.addStackSuppressions(apiStack,
    [
      { id: 'AwsSolutions-APIG4', reason: 'Endpoints set to no authorizer as it is serving the required HEADERS for CORS correctly. It is an auto-generated endpoint by API Gateway with pre-flight options.' }
      , { id: 'AwsSolutions-COG4', reason: 'Endpoints set to no authorizer as it is serving the required HEADERS for CORS correctly. It is an auto-generated endpoint by API Gateway with pre-flight options.' }
      , { id: 'AwsSolutions-COG3', reason: 'Cognito User Pool with custom password policy and MFA required. This is sample code and Advanced security mode not set.' }
      , { id: 'AwsSolutions-APIG2', reason: 'Backend integration Lambda will validate request input and is this is sample code only.' }
      , { id: 'AwsSolutions-IAM4', reason: 'Managed policy only permits Lambda function to write to CloudWatch' }
      , { id: 'AwsSolutions-IAM5', reason: 'The wildcard permissions used by Lambda functions to manage api keys, usage plans, tags for API Gateway' }
    ])
    NagSuppressions.addStackSuppressions(authStack,
      [
        { id: 'AwsSolutions-COG3', reason: 'Cognito User Pool with custom password policy and MFA required. This is sample code and Advanced security mode not set.' }
      ])
}

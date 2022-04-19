#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ApiStack } from '../lib/api-stack';
import { NagSuppressions, AwsSolutionsChecks } from 'cdk-nag';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION
}

const apiStack = new ApiStack(app, 'APIStack', {
  env,
  cognitoUserPoolId: "" // replace with react/src/aws-exports.js:aws_user_pools_id
});

if (apiStack.node.tryGetContext('AWS_SOLUTIONS_CHECK')) {
  cdk.Aspects.of(app).add(new AwsSolutionsChecks());
  NagSuppressions.addStackSuppressions(apiStack,
    [
      { id: 'AwsSolutions-APIG4', reason: 'CORS OPTIONS Method' }
      , { id: 'AwsSolutions-APIG2', reason: 'Request validation' }
      , { id: 'AwsSolutions-COG4', reason: 'CORS OPTIONS Method' }
      , { id: 'AwsSolutions-IAM4', reason: 'Manged IAM policy attachment' }
      , { id: 'AwsSolutions-IAM5', reason: 'Permission to usage plan and API keys' }
    ])
}

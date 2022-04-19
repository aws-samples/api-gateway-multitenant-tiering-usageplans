import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { RemovalPolicy } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from 'aws-cdk-lib/custom-resources';
import { UserPool } from 'aws-cdk-lib/aws-cognito';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import { NagSuppressions } from 'cdk-nag';
const path = require('path');

interface PlanData {
  name: string,
  description: string,
  rateLimit: number,
  burstLimit: number,
  quotaLimit: number,
  quotaOffset: number,
  period: apigateway.Period,
  price: string
}

// convenience function: create a usage plan
function createUsagePlan(gw: apigateway.RestApi, plan: PlanData): apigateway.UsagePlan {
  return gw.addUsagePlan(plan.name, {
    name: plan.name,
    description: plan.description,
    throttle: {
      rateLimit: plan.rateLimit,
      burstLimit: plan.burstLimit,
    },
    quota: {
      limit: plan.rateLimit,
      offset: plan.quotaOffset,
      period: plan.period
    },
    apiStages: [{ stage: gw.deploymentStage }]
  });
}

function createDynamoSeed(id: string, plan: PlanData): any {
  return {
    PutRequest: {
      Item: {
        id: { S: id },
        name: { S: plan.name },
        description: { S: plan.description },
        quota: { S: `${plan.quotaLimit} per ${plan.period}` },
        throttle: { S: `${plan.rateLimit} TPS` },
        price: { N: plan.price }
      }
    }
  }
}

// make cognitoUserPoolId a required prop
export interface ApiStackProps extends StackProps {
  cognitoUserPoolId: string;
}

export class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const encryptionKey = new kms.Key(this, 'Key', {
      enableKeyRotation: true,
    });

    // DynamoDB Table for Usage Plans and metadata
    const plans = new dynamodb.Table(this, 'TieredAPI_Plans', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      readCapacity: 1,
      writeCapacity: 1,
      removalPolicy: RemovalPolicy.DESTROY,
      pointInTimeRecovery: true, // best practice
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey, // This will be exposed as table.encryptionKey
    });

    // DynamoDB Table for API Keys and metadata
    const keys = new dynamodb.Table(this, 'TieredAPI_Keys', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      readCapacity: 1,
      writeCapacity: 1,
      removalPolicy: RemovalPolicy.DESTROY,
      pointInTimeRecovery: true, // best practice
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey, // This will be exposed as table.encryptionKey
    });

    const allowKMSKeyUse = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        "kms:Decrypt"
      ],
      resources: [encryptionKey.keyArn]

    })

    const apiGatewayPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        "apigateway:DELETE",
        "apigateway:PATCH",
        "apigateway:POST",
        "apigateway:PUT",
        "apigateway:GET"
      ],
      resources: [
        `arn:aws:apigateway:${props.env?.region}::/apikeys/*`,
        `arn:aws:apigateway:${props.env?.region}::/apikeys`,
        `arn:aws:apigateway:${props.env?.region}::/usageplans/*/keys/*`,
        `arn:aws:apigateway:${props.env?.region}::/usageplans/*/keys`,
        `arn:aws:apigateway:${props.env?.region}::/tags/*`
      ]
    });

    // Policy that allows basic Reads on new DynamoDB tables (and logging)
    const allowDDBReadsAndKMSPolicy = new iam.Policy(this, "TieredAPI_Read_LambdaPolicy", {
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            "dynamodb:GetItem",
            "dynamodb:Query",
            "dynamodb:Scan",
          ],
          resources: [plans.tableArn, keys.tableArn]
        }),
        allowKMSKeyUse,
        apiGatewayPolicy,
      ]
    })

    // Policy that allows basic Create on new DynamoDB tables (and logging)
    const allowDDBCreateAndKMSPolicy = new iam.Policy(this, "TieredAPI_Create_LambdaPolicy", {
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            "dynamodb:PutItem",
            "dynamodb:GetItem",
          ],
          resources: [plans.tableArn, keys.tableArn]
        }),
        allowKMSKeyUse,
        apiGatewayPolicy,
      ]
    })

    // Policy that allows basic Create on new DynamoDB tables (and logging)
    const allowDDBDeleteAndKMSPolicy = new iam.Policy(this, "TieredAPI_Delete_LambdaPolicy", {
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            "dynamodb:DeleteItem",
            "dynamodb:GetItem",
          ],
          resources: [plans.tableArn, keys.tableArn]
        }),
        allowKMSKeyUse,
        apiGatewayPolicy,
      ]
    })

    // Policy that allows basic Create on new DynamoDB tables (and logging)
    const allowDDBUpdateAndKMSPolicy = new iam.Policy(this, "TieredAPI_Update_LambdaPolicy", {
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            "dynamodb:UpdateItem",
            "dynamodb:GetItem",
          ],
          resources: [plans.tableArn, keys.tableArn]
        }),
        allowKMSKeyUse,
        apiGatewayPolicy,
      ]
    })

    // Role for Lambda to assume that has new policy
    const lambdaCreateRole = new iam.Role(this, "TieredAPI_Create_LambdaRole", {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Assumed by Lambda Functions',
      inlinePolicies: { allowDDBCreateAndKMSPolicy: allowDDBCreateAndKMSPolicy.document },
      managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")],
    })

    const lambdaReadRole = new iam.Role(this, "TieredAPI_Read_LambdaRole", {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Assumed by Lambda Functions',
      inlinePolicies: { allowDDBReadsAndKMSPolicy: allowDDBReadsAndKMSPolicy.document },
      managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")],
    })

    const lambdaUpdateRole = new iam.Role(this, "TieredAPI_Update_LambdaRole", {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Assumed by Lambda Functions',
      inlinePolicies: { allowDDBUpdateAndKMSPolicy: allowDDBUpdateAndKMSPolicy.document },
      managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")],
    })

    const lambdaDeleteRole = new iam.Role(this, "TieredAPI_Delete_LambdaRole", {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Assumed by Lambda Functions',
      inlinePolicies: { allowDDBDeleteAndKMSPolicy: allowDDBDeleteAndKMSPolicy.document },
      managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")],
    })

    // Lambda for basic health check, this will stay unprotected
    const getDataLambda = new lambda.Function(this, 'getData', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'get_data.handler',
      code: lambda.Code.fromAsset('../lambda'),
      deadLetterQueueEnabled: false,
    });

    // getPlans   
    const getPlansLambda = new lambda.Function(this, 'getPlans', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'get_plans.handler',
      code: lambda.Code.fromAsset('../lambda'),
      role: lambdaReadRole,
      environment: {
        PLANS_TABLE_NAME: plans.tableName,
        KEYS_TABLE_NAME: keys.tableName
      },
      deadLetterQueueEnabled: false,
    });

    // getPlan   
    const getPlanLambda = new lambda.Function(this, 'getPlan', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'get_plan.handler',
      code: lambda.Code.fromAsset('../lambda'),
      role: lambdaReadRole,
      environment: {
        PLANS_TABLE_NAME: plans.tableName,
        KEYS_TABLE_NAME: keys.tableName
      },
      deadLetterQueueEnabled: false,
    });

    // getKeys   
    const getKeysLambda = new lambda.Function(this, 'getKeys', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'get_keys.handler',
      code: lambda.Code.fromAsset('../lambda'),
      role: lambdaReadRole,
      environment: {
        PLANS_TABLE_NAME: plans.tableName,
        KEYS_TABLE_NAME: keys.tableName
      },
      deadLetterQueueEnabled: false,
    });

    // createKey  
    const createKeyLambda = new lambda.Function(this, 'createKey', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'create_key.handler',
      code: lambda.Code.fromAsset('../lambda'),
      role: lambdaCreateRole,
      environment: {
        PLANS_TABLE_NAME: plans.tableName,
        KEYS_TABLE_NAME: keys.tableName
      },
      deadLetterQueueEnabled: false,
    });

    // getKey    
    const getKeyLambda = new lambda.Function(this, 'getKey', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'get_key.handler',
      code: lambda.Code.fromAsset('../lambda'),
      role: lambdaReadRole,
      environment: {
        PLANS_TABLE_NAME: plans.tableName,
        KEYS_TABLE_NAME: keys.tableName
      },
      deadLetterQueueEnabled: false,
    });

    // updateKey 
    const updateKeyLambda = new lambda.Function(this, 'updateKey', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'update_key.handler',
      code: lambda.Code.fromAsset('../lambda'),
      role: lambdaUpdateRole,
      environment: {
        PLANS_TABLE_NAME: plans.tableName,
        KEYS_TABLE_NAME: keys.tableName
      },
      deadLetterQueueEnabled: false,
    });

    // deleteKey 
    const deleteKeyLambda = new lambda.Function(this, 'deleteKey', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'delete_key.handler',
      code: lambda.Code.fromAsset('../lambda'),
      role: lambdaDeleteRole,
      environment: {
        PLANS_TABLE_NAME: plans.tableName,
        KEYS_TABLE_NAME: keys.tableName
      },
      deadLetterQueueEnabled: false,
    });

    const logGroup = new logs.LogGroup(this, "MultiTenantSampleAPILogs");

    // Create the whole REST API Gateway
    const apigw = new apigateway.RestApi(this, "MultiTenantSampleAPI", {
      defaultCorsPreflightOptions: { // this is useful for debugging as the react app's origin may be localhost. Reconsider for production.
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS // this is also the default
      },
      deployOptions: {
        cachingEnabled: false, // Suggest true for production systems
        tracingEnabled: false, // Suggest true for production/development systems.
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        accessLogDestination: new apigateway.LogGroupLogDestination(logGroup),
        accessLogFormat: apigateway.AccessLogFormat.clf(),
      },
    });

    // All these resources are throttled and will require an API Key
    const getDataResource = apigw.root.addResource('api');
    const getDataApi = getDataResource.addMethod('GET', new apigateway.LambdaIntegration(getDataLambda), {
      apiKeyRequired: true,
    });

    const userPool = UserPool.fromUserPoolId(this, 'UserPool', props.cognitoUserPoolId);

    // All these resources will require Cognito
    const auth = new apigateway.CognitoUserPoolsAuthorizer(this, 'UserAuthorizer', {
      cognitoUserPools: [userPool]
    });

    const adminResource = apigw.root.addResource('admin');
    const plansResource = adminResource.addResource('plans');
    const getPlansApi = plansResource.addMethod('GET', new apigateway.LambdaIntegration(getPlansLambda), {
      authorizer: auth,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    const planResource = plansResource.addResource('{id}');
    const getPlanApi = planResource.addMethod('GET', new apigateway.LambdaIntegration(getPlanLambda), {
      authorizer: auth,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    const keysResource = adminResource.addResource('keys');
    const getKeysApi = keysResource.addMethod('GET', new apigateway.LambdaIntegration(getKeysLambda), {
      authorizer: auth,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    const createKeyApi = keysResource.addMethod('POST', new apigateway.LambdaIntegration(createKeyLambda), {
      authorizer: auth,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    const keyResource = keysResource.addResource('{id}');
    const getKeyApi = keyResource.addMethod('GET', new apigateway.LambdaIntegration(getKeyLambda), {
      authorizer: auth,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    const updateKeyApi = keyResource.addMethod('PUT', new apigateway.LambdaIntegration(updateKeyLambda), {
      authorizer: auth,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    const deleteKeyApi = keyResource.addMethod('DELETE', new apigateway.LambdaIntegration(deleteKeyLambda), {
      authorizer: auth,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    const usagePlans = {
      testPlan: {
        name: 'TestPlan',
        description: 'A simple plan for demonstration purposes',
        rateLimit: 10,
        burstLimit: 5,
        quotaLimit: 20,
        quotaOffset: 0,
        period: apigateway.Period.DAY,
        price: "0.00"
      },
      freePlan: {
        name: 'FreePlan',
        description: 'Free Service',
        rateLimit: 10,
        burstLimit: 5,
        quotaLimit: 2000,
        quotaOffset: 0,
        period: apigateway.Period.DAY,
        price: "0.00"
      },
      basicPlan: {
        name: 'BasicPlan',
        description: 'Basic paid service',
        rateLimit: 100,
        burstLimit: 50,
        quotaLimit: 5000,
        quotaOffset: 0,
        period: apigateway.Period.MONTH,
        price: "19.99"
      },
      premiumPlan: {
        name: 'PremiumPlan',
        description: 'When only the best will do',
        rateLimit: 100,
        burstLimit: 50,
        quotaLimit: 50000,
        quotaOffset: 0,
        period: apigateway.Period.MONTH,
        price: "69.99"
      }
    }

    // create some usage plans
    const testPlan = createUsagePlan(apigw, usagePlans.testPlan);
    const freePlan = createUsagePlan(apigw, usagePlans.freePlan);
    const basicPlan = createUsagePlan(apigw, usagePlans.basicPlan);
    const premiumPlan = createUsagePlan(apigw, usagePlans.premiumPlan);

    // seed the Plans Table with the new usage plans.
    const seedPlansDb = new AwsCustomResource(this, 'seedPlansDb', {
      functionName: 'seedPlansDb',
      onCreate: {
        service: 'DynamoDB',
        action: 'batchWriteItem',
        parameters: {
          RequestItems: {
            [plans.tableName]: [
              createDynamoSeed(testPlan.usagePlanId, usagePlans.testPlan),
              createDynamoSeed(freePlan.usagePlanId, usagePlans.freePlan),
              createDynamoSeed(basicPlan.usagePlanId, usagePlans.basicPlan),
              createDynamoSeed(premiumPlan.usagePlanId, usagePlans.premiumPlan),
            ]
          }
        },
        physicalResourceId: PhysicalResourceId.of('seedPlansDb'), // Use the token returned by the call as physical id
      },
      policy: {
        statements: [allowKMSKeyUse, new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            "dynamodb:PutItem",
            "dynamodb:BatchWriteItem",
            "dynamodb:DescribeTable"
          ],
          resources: [plans.tableArn, keys.tableArn]
        })]
      },
    })
  }
}

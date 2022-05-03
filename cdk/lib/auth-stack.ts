import { Stack, StackProps, CfnOutput, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { RemovalPolicy } from 'aws-cdk-lib';
import * as cognito from "aws-cdk-lib/aws-cognito";

export class AuthStack extends Stack {
  public readonly userPool: cognito.UserPool;
  public readonly client: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const userPool = new cognito.UserPool(this, "UserPool", {
      removalPolicy: RemovalPolicy.DESTROY,
      autoVerify: {email: true},
      passwordPolicy:{
          minLength: 8,
          requireDigits: true,
          requireLowercase: true,
          requireSymbols: true,
          requireUppercase: true,
          tempPasswordValidity: Duration.days(3)
      },
      signInAliases: {email: true, username: false},
      selfSignUpEnabled: true,
      mfa: cognito.Mfa.REQUIRED,
      mfaSecondFactor: {
        otp: true,
        sms: false,
      },
    });

    // Set the advancedSecurityMode to ENFORCED
    const cfnUserPool = userPool.node.findChild('Resource') as cognito.CfnUserPool;
    cfnUserPool.userPoolAddOns = {
      advancedSecurityMode: 'ENFORCED'
    };

    const client = userPool.addClient("WebClient", {
      userPoolClientName: "webClient",
      idTokenValidity: Duration.days(1),
      accessTokenValidity: Duration.days(1),
      authFlows: {
        userPassword: true,
        userSrp: true,
        custom: true,
      },
    });

    this.userPool = userPool;
    this.client = client;

    new CfnOutput(this, "CognitoUserPoolId", {
      value: userPool.userPoolId,
      description: "userPoolId required for frontend settings",
    });
    new CfnOutput(this, "CognitoUserPoolWebClientId", {
      value: client.userPoolClientId,
      description: "clientId required for frontend settings",
    });
  }
}
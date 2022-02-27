# Multi-Tenant Tiering with API Gateway and Usage Plans

## Summary

This repository contains a working demo of throttling REST APIs in Amazon API Gateway in a multi-tenant situation. Throttling is an important strategy to protect backend services from excessive load. API Gateway offers the ability to apply throttling on a per-tenant basis, so that all tentants get their fair share. 

This code sample implements a tiered multi-tenant strategy which is a practical consideration at large scale, because the number API Keys available per account per regioned is subject to [quota limits](https://docs.aws.amazon.com/apigateway/latest/developerguide/limits.html) and may be significantly less than the total number of tentants. 

## Cloud Architecture
![Workshop Architecture](/assets/images/architecture2.png)

## Description

When deployed, the user has a sample web application that shows how customers can create accounts and "purchase" API Keys at different service tiers. And they will be able to call the REST API that is protected by an API Key and see behavior if they trigger throttling.

The web app invokes REST APIs on a single AWS API Gateway deployment. Calls that perform CRUD operations on API Keys are grouped into `/admin/*` and require authentication with Amazon Cognito. A single REST API, `GET /api/data` is protected by the Usage Plan.  

## Installation 
See [INSTALL.md](./INSTALL.md)


## Walkthrough
See [WALKTHROUGH.md](./WALKTHROUGH.md)


## Clean Up
Removing the deployed assets from AWS account is done with the followig commands

```bash
#  where TOP is root directory of the code sample

cd ${TOP}/cdk
cdk destroy

cd ${TOP}/react
amplify delete
```

Note that the default behavior of `cdk destroy` is to retain certain stateful resources, such as DynamoDB Tables. As this is a code sample for training only, the CDK scripts have an explicit `removalPolicy` to override that default behavior and remove the DynamoDB Tables as well. 



## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## Code of Conduct
This project has adopted the [Amazon Open Source Code of Conduct](https://aws.github.io/code-of-conduct).
For more information see the [Code of Conduct FAQ](https://aws.github.io/code-of-conduct-faq) or contact
opensource-codeofconduct@amazon.com with any additional questions or comments.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.

SPDX-License-Identifier: MIT-0
OSI Approved :: MIT No Attribution License (MIT-0)

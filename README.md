# Applying tiering strategies to manage throttling in a multi-tenant system with Amazon API Gateway Usage Plans
## Overview

Amazon API Gateway Usage Plans and API Keys help implement solutions for tiering strategy, managing noisy neighbor effects in a multi-tenant environment. Throttling and quotas help manage and minimize potential impacts by one tenant's ability to affect other tenants experience commonly known as noisy neighbor.

This repository contains a working demo of throttling REST APIs in Amazon API Gateway in a multi-tenant situation. Throttling is an important strategy to protect backend services from excessive load. API Gateway offers the ability to apply throttling on a per-tenant basis, so that all tenants get their fair share. 

This code sample implements a tiered multi-tenant strategy which is a practical consideration at large scale, because the number API Keys available per account per region is subject to [quota limits](https://docs.aws.amazon.com/apigateway/latest/developerguide/limits.html) and may be significantly less than the total number of tenants. 

## Solution Architecture
![Workshop Architecture](/assets/images/architecture.png)

## Description

The sample web application provides administrative functions on how customers can sign up and "purchase" API Keys at different service tiers. The sample app also allows users to call the REST API protected by API Key to test and observe throttle and quota behavior with Usage Plans.

The web app invokes REST APIs on a single Amazon API Gateway deployment. Calls that perform CRUD operations on API Keys are grouped into `/admin/*` and require authentication with Amazon Cognito. A single REST API, `GET /api/data` is protected by the Usage Plan.  

## Installation 
See [INSTALL](./INSTALL.md)


## Walkthrough
See [WALKTHROUGH](./WALKTHROUGH.md)


## Enable Pooling
See [POOLING_AKI_KEYS](./POOLING_AKI_KEYS.md)

## Clean Up
Removing the deployed assets from AWS account is done with the following commands

```bash

cd cdk
cdk destroy --all

cd react
amplify delete
```

Note that the default behavior of `cdk destroy` is to retain certain stateful resources, such as Amazon DynamoDB Tables. As this is a code sample for training only, the CDK scripts have an explicit `removalPolicy` to override that default behavior and remove the Amazon DynamoDB Tables as well. 

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

//  Contains a list of API Keys that are pooled resources among tenants.
//
//  e.g.
//  [{
//     planName: "FreePlan"
//     planId: "xyz123",
//     apiKeys: [ "abc123" ]
//   },
//  {
//     planName: "BasicPlan"
//     planId: "...",
//     apiKeys: [ "...", "...", "...", "...", "..." ]
//   }];
//
//  In the example above. The Free plan is a globally shared API Key
//  And the Basic plan is a hybrid strategy that shards tenants across a couple API Keys.

exports.apiKeyPools = [];

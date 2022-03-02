//  Contains a list of API Keys that are pooled resources among tenants.
//
//  e.g.

//
//  In the example above. The Free plan is a globally shared API Key
//  And the Basic plan is a hybrid strategy that shards tenants across a couple API Keys.


// NOTE: This list of pooled IDs is empty
const apiKeyPools = [
//  {
//     planName: "FreePlan"
//     planId: "...",
//     apiKeys: [ "..." ]
//   },
//  {
//     planName: "BasicPlan"
//     planId: "...",
//     apiKeys: [ "...", "...", "...", "...", "..." ]
//   }
];


/**
 * 
 * @param {*} planId 
 * @returns Associated Pool information from apiKeyPools
 */
exports.findPoolForPlanId = (planId) => { 
  return apiKeyPools.find((item) => item.planId === planId);
}

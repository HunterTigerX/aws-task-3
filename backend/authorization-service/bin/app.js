const cdk = require("aws-cdk-lib");
const { AuthorizationStack } = require("../lib/stack");

const app = new cdk.App();
new AuthorizationStack(app, "AuthorizationStack", {
  stackName: "AuthorizationStack",
  env: {
    region: "eu-central-1",
  },
});



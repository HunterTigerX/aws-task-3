const cdk = require("aws-cdk-lib");
const { ImportStack } = require("../lib/stack");

const app = new cdk.App();
new ImportStack(app, "ImportStack", {
  stackName: "ImportStack",
  env: {
    region: "eu-central-1",
  },
});

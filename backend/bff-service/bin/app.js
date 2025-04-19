const cdk = require("aws-cdk-lib");
const { bffStack } = require("../lib/stack");

const app = new cdk.App();
new bffStack(app, "bffStack", {
  stackName: "bffStack",
  env: {
    region: "eu-central-1",
  },
});

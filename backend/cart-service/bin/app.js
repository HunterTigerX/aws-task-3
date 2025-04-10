const cdk = require("aws-cdk-lib");
const { CartStack } = require("../lib/stack");

const app = new cdk.App();
new CartStack(app, "CartStack", {
  stackName: "CartStack",
  env: {
    region: "eu-central-1",
  },
});


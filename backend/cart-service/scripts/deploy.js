const { execSync } = require("child_process");
const path = require("path");

function execute(command, cwd) {
  try {
    execSync(command, {
      stdio: "inherit",
      cwd: cwd || process.cwd(),
      env: { ...process.env }, // Ensure environment variables are passed through
    });
  } catch (error) {
    console.error(`Failed to execute ${command}`);
    console.error("Error details:", error.message);
    if (error.stdout) console.error("stdout:", error.stdout.toString());
    if (error.stderr) console.error("stderr:", error.stderr.toString());
    process.exit(1);
  }
}

async function deploy() {
  try {
    console.log("Installing Deps nest");
    execute("npm install", path.join(__dirname, "../lambda/nest"));

    console.log("Installing Deps db");
    execute("npm install", path.join(__dirname, "../lambda/db-init"));

    // Build and deploy app
    console.log("Installing app dependencies...");
    execute(
      "npm install --legacy-peer-deps",
      path.join(__dirname, "../../../frontend-cart")
    );

    console.log("Building application...");
    execute("npm run build", path.join(__dirname, "../../../frontend-cart"));

    // Deploy infrastructure
    console.log("Installing CDK dependencies...");
    execute("npm install --legacy-peer-deps");

    console.log("Deploying infrastructure...");
    execute("cdk deploy --require-approval never");

    console.log("\nProduct deployment completed successfully!");
  } catch (error) {
    console.error("Deployment failed:", error);
    process.exit(1);
  }
}

deploy();

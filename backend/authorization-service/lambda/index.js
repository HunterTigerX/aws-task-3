const handler = async (event) => {
  console.log("Event: ", JSON.stringify(event));
  console.log("event.authorizationToken", event.authorizationToken);
  const storedCredentials = process.env.CREDENTIALS || "";
  const login = storedCredentials.split("=")[0];

  if (event.authorizationToken === "Basic null") {
    generatePolicy(login, "Deny", event.methodArn, event.methodArn);
    throw new Error("Unauthorized");
  }

  try {
    // Get the authorization token
    const unknownToken = event.authorizationToken.split(" ");
    let authToken;
    if (unknownToken.length > 1) {
      authToken = unknownToken[1];
    } else {
      authToken = unknownToken[0];
    }

    const decodedString = Buffer.from(authToken, "base64").toString("ascii");

    if (decodedString === storedCredentials) {
      return generatePolicy(login, "Allow", event.methodArn, event.methodArn);
    } else {
      // Invalid credentials, deny with 403 context
      return generatePolicy(login, "Deny", event.methodArn, event.methodArn);
    }
  } catch (error) {
    console.error("Error:", error);
    return generatePolicy(login, "Deny", event.methodArn, event.methodArn);
  }
};

const generatePolicy = (principalId, effect, resource) => {
  const authResponse = {
    principalId: principalId,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: resource,
        },
      ],
    },
  };
  return authResponse;
};

module.exports = { handler };

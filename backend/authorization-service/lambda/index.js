const handler = async (event) => {
  console.log("Event: ", JSON.stringify(event));

  if (!event.authorizationToken) {
    return generatePolicy("user", "Deny", event.methodArn, {
      custom: "401",
    });
  }

  try {
    // Get the stored credentials from environment variable
    const storedCredentials = process.env.CREDENTIALS;
    console.log("Stored credentials:", storedCredentials);

    // Get the authorization token
    const authToken = event.authorizationToken;

    if (authToken === process.env.login) {
      return generatePolicy("user", "Allow", event.methodArn, {
        custom: "200",
      });
    } else {
      // Invalid credentials, deny with 403 context
      return generatePolicy("user", "Deny", event.methodArn, {
        custom: "403",
      });
    }
  } catch (error) {
    console.error("Error:", error);
    return generatePolicy("user", "Deny", event.methodArn, {
      custom: "403",
    });
  }
};

const generatePolicy = (principalId, effect, resource, context) => {
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

  if (context) {
    authResponse.context = context;
  }

  return authResponse;
};

module.exports = { handler };

const axios = require("axios");

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
    try {
      console.log("authToken", authToken);
      const profileUrl =
        "https://wu9umi35c8.execute-api.eu-central-1.amazonaws.com/prod/api/auth/login";
      const [username, password] = decodedString.split(":");

      const userExists = await axios({
        method: "POST",
        url: profileUrl,
        headers: {
          "Content-Type": "application/json",
        },
        data: {
          username,
          password,
        },
      });
      if (userExists.status === 200) {
        return generatePolicy(login, "Allow", event.methodArn, event.methodArn);
      }
    } catch (err) {
      console.error(err);
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

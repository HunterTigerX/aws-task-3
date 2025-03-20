const handler = async (event) => {
    console.log('Event: ', JSON.stringify(event));
  
    if (!event.headers?.Authorization) {
      return generatePolicy('user', 'Deny', event.methodArn, 401);
    }
  
    try {
      const authHeader = event.headers.Authorization;
      const encodedCreds = authHeader.split(' ')[1];
      const plainCreds = Buffer.from(encodedCreds, 'base64').toString().split(':');
      const username = plainCreds[0];
      const password = plainCreds[1];
  
      console.log(`username: ${username}, password: ${password}`);
  
      const storedCredentials = process.env.CREDENTIALS.split(',');
      const userCredentials = storedCredentials
        .map(pair => pair.split('='))
        .find(([user]) => user === username);
  
      const storedPassword = userCredentials ? userCredentials[1] : null;
  
      if (storedPassword && storedPassword === password) {
        return generatePolicy(username, 'Allow', event.methodArn, 200);
      } else {
        return generatePolicy(username, 'Deny', event.methodArn, 403);
      }
    } catch (error) {
      return generatePolicy('user', 'Deny', event.methodArn, 403);
    }
  };
  
  const generatePolicy = (principalId, effect, resource, statusCode) => {
    const authResponse = {
      principalId: principalId
    };
  
    if (effect && resource) {
      const policyDocument = {
        Version: '2012-10-17',
        Statement: [{
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource
        }]
      };
      authResponse.policyDocument = policyDocument;
    }
  
    authResponse.context = {
      statusCode: statusCode
    };
  
    return authResponse;
  };
  
  module.exports = { handler };
  
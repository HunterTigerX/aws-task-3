const { proxyRequest } = require('./proxy.js');
const { isServiceName } = require('./serviceName.js');

exports.handler = async (event) => {
  console.log('Entering BFF Lambda')
  try {
    const serviceName = event.pathParameters.proxy.toLowerCase();
    const method = event.httpMethod;
    const query = event.queryStringParameters || {};
    const headers = event.headers || {};
    const body = event.body ? JSON.parse(event.body) : null;

    console.log('serviceName lambda', event.pathParameters.proxy)
    console.log('method lambda', method)
    console.log('query', query)
    console.log('event', event)
    // console.log('headers', headers)
    console.log('body', body)

    console.log('isServiceName 1', isServiceName(serviceName))
    console.log('isServiceName 2', isServiceName(serviceName.split('/')[0]))

    if (isServiceName(serviceName) || isServiceName(serviceName.split('/')[0])) {
      const result = await proxyRequest(
        serviceName, // event.pathParameters.proxy
        method,
        query,
        headers,
        body,
        "lambda"
      );
  
      return {
        statusCode: result.status || 200,
        headers: {
          ...(result.headers || {}),
          'Cache-Control': 'public, max-age=120' // 2 minutes
        },
        body: JSON.stringify(result.data)
      };
    } else {
      return {
        statusCode: 502,
        body: JSON.stringify({ message: `Service ${serviceName} not supported` })
      };
    }


  } catch (error) {
    console.error('Error in BFF Lambda:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
};
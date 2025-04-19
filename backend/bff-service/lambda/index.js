const { proxyRequest } = require('./app/src/proxy');
const ServiceName = require('./app/src/types');

exports.handler = async (event) => {
  try {
    const serviceName = event.pathParameters?.serviceName?.toLowerCase();
    const method = event.httpMethod;
    const path = event.path.split(`/${serviceName}`)[1] || '/';
    const query = event.queryStringParameters || {};
    const headers = event.headers || {};
    const body = event.body ? JSON.parse(event.body) : null;

    if (!Object.values(ServiceName).includes(serviceName)) {
      return {
        statusCode: 502,
        body: JSON.stringify({ message: `Service ${serviceName} not supported` })
      };
    }

    const result = await proxyRequest(
      serviceName,
      method,
      path,
      query,
      headers,
      body
    );

    return {
      statusCode: result.status || 200,
      headers: {
        ...(result.headers || {}),
        'Cache-Control': 'public, max-age=120' // 2 minutes
      },
      body: JSON.stringify(result.data)
    };
  } catch (error) {
    console.error('Error in BFF Lambda:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
};
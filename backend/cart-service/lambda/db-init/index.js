const { Client } = require('pg');
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

const secretsManager = new AWS.SecretsManager();

exports.handler = async (event, context) => {
  console.log('Event:', JSON.stringify(event));
  
  // Handle delete event
  if (event.RequestType === 'Delete') {
    return {
      PhysicalResourceId: event.PhysicalResourceId,
      Status: 'SUCCESS'
    };
  }

  let client;
  try {
    const secretData = await secretsManager.getSecretValue({
      SecretId: process.env.DB_SECRET_ARN
    }).promise();
    
    const secret = JSON.parse(secretData.SecretString);
    
    client = new Client({
      host: secret.host,
      port: secret.port,
      database: process.env.DB_NAME,
      user: secret.username,
      password: secret.password,
    });
    
    await client.connect();
    
    // Read and execute SQL file
    const sqlFile = path.join(__dirname, 'init.sql');
    const sqlScript = fs.readFileSync(sqlFile, 'utf8');
    await client.query(sqlScript);

    return {
      PhysicalResourceId: 'db-init-' + Date.now(),
      Status: 'SUCCESS',
      Data: {
        Message: 'Database initialized successfully'
      }
    };
  } catch (error) {
    console.error('Database initialization failed:', error);
    return {
      PhysicalResourceId: event.PhysicalResourceId || 'failed-init',
      Status: 'FAILED',
      Reason: error.message
    };
  } finally {
    if (client) {
      await client.end();
    }
  }
};

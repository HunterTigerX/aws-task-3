const fastify = require("fastify");
const cors = require("@fastify/cors");
const dotenv = require("dotenv");
const { proxyRequest } = require("./proxy.js");

dotenv.config();

const app = fastify({ logger: true });

// Register CORS
app.register(cors, {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
});

// Health check endpoint
app.get("/health", async (request, reply) => {
  console.log("health check");
  reply.status(200).send({ status: "OK" });
});

app.all(
  "/:serviceName",
  async (request, reply) => {
    const { serviceName } = request.params;
    const { method, headers, query, body } = request;

    const forwardedHeaders = { ...headers };

    try {
      const result = await proxyRequest(
        serviceName.toLowerCase(),
        method,
        query,
        forwardedHeaders,
        body
      );
      // console.log('result', result)
      if (result && result.data.message) {
        reply.status(result.status).send({ message: result?.data.message });
      } else {
        if (result.data) {
          return result.data;
        }
      }
    } catch (error) {
      if (
        (error).message &&
        (error).message.includes("Service URL not configured")
      ) {
        reply.status(502).send({ message: "Cannot process request" });
      } else {
        reply.status(500).send({ message: "Internal server error at app.ts" });
      }
    }
  }
);

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || "3000");
    await app.listen({ port, host: "0.0.0.0" });
    console.log(`BFF Service running on port ${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();

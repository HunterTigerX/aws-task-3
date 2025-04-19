import fastify, {
  FastifyInstance,
  FastifyRequest,
  FastifyReply,
} from "fastify";
import cors from "@fastify/cors";
import dotenv from "dotenv";
import { proxyRequest } from "./proxy";
import { ServiceName } from "./types";

dotenv.config();

const app: FastifyInstance = fastify({ logger: true });

// Register CORS
app.register(cors, {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
});

// Health check endpoint
app.get("/health", async (request: FastifyRequest, reply: FastifyReply) => {
  console.log("health check");
  reply.status(200).send({ status: "OK" });
});

app.all(
  "/:serviceName",
  async (request: FastifyRequest, reply: FastifyReply) => {
    const { serviceName } = request.params as { serviceName: string };
    const { method, headers, query, body } = request;

    const forwardedHeaders = { ...headers };

    try {
      const result = await proxyRequest(
        serviceName.toLowerCase() as ServiceName,
        method,
        request.url.split("?")[0].replace(`/${serviceName}`, "") || "/",
        query as Record<string, any>,
        forwardedHeaders,
        body
      );
      // console.log('result', result)
      if (result && result.status !== 200) {
        reply.status(result.status).send({ message: result?.data.message });
      } else if (result && result.status === 200) {
        return result.data;
      }
    } catch (error) {
      if (
        (error as Error).message &&
        (error as Error).message.includes("Service URL not configured")
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

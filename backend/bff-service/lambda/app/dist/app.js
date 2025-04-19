"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const proxy_1 = require("./proxy");
dotenv_1.default.config();
const app = (0, fastify_1.default)({ logger: true });
// Register CORS
app.register(cors_1.default, {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
});
// Health check endpoint
app.get("/health", async (request, reply) => {
    console.log("health check");
    reply.status(200).send({ status: "OK" });
});
app.all("/:serviceName", async (request, reply) => {
    const { serviceName } = request.params;
    const { method, headers, query, body } = request;
    const forwardedHeaders = { ...headers };
    try {
        const result = await (0, proxy_1.proxyRequest)(serviceName.toLowerCase(), method, request.url.split("?")[0].replace(`/${serviceName}`, "") || "/", query, forwardedHeaders, body);
        console.log('result', result);
        if (result && result.status !== 200) {
            reply.status(result.status).send({ message: result?.data.message });
        }
        else if (result && result.status === 200) {
            return result.data;
        }
    }
    catch (error) {
        if (error.message &&
            error.message.includes("Service URL not configured")) {
            reply.status(502).send({ message: "Cannot process request" });
        }
        else {
            reply.status(500).send({ message: "Internal server error at app.ts" });
        }
    }
});
const start = async () => {
    try {
        const port = parseInt(process.env.PORT || "3000");
        await app.listen({ port, host: "0.0.0.0" });
        console.log(`BFF Service running on port ${port}`);
    }
    catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};
start();

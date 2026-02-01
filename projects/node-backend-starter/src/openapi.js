const ErrorResponse = {
  type: "object",
  properties: {
    ok: { type: "boolean", example: false },
    error: { type: "string" },
    message: { type: "string" },
    details: {},
  },
  required: ["ok", "error", "message"],
};

export const openapiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Node Backend Starter",
    version: "1.0.0",
    description: "Starter backend with versioned API, validation, tests, CI, and docs",
  },
  servers: [{ url: "/" }],
  components: {
    schemas: {
      ErrorResponse,
      HealthResponse: {
        type: "object",
        properties: {
          ok: { type: "boolean", example: true },
          service: { type: "string", example: "node-backend-starter" },
          time: { type: "string", example: "2026-02-01T07:11:47.985Z" },
        },
        required: ["ok", "service", "time"],
      },
      EchoRequest: {
        type: "object",
        properties: {
          message: { type: "string", minLength: 1 },
        },
        required: ["message"],
      },
      EchoResponse: {
        type: "object",
        properties: {
          ok: { type: "boolean", example: true },
          message: { type: "string" },
        },
        required: ["ok", "message"],
      },
    },
  },
  paths: {
    "/api/v1/health": {
      get: {
        summary: "Health check",
        responses: {
          200: {
            description: "Service is healthy",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HealthResponse" },
              },
            },
          },
          429: {
            description: "Too many requests",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          500: {
            description: "Unexpected server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/echo": {
      post: {
        summary: "Echo message",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/EchoRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Echo response",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/EchoResponse" },
              },
            },
          },
          400: {
            description: "Validation error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          429: {
            description: "Too many requests",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          500: {
            description: "Unexpected server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
  },
};

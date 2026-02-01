export const openapiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Node Backend Starter",
    version: "1.0.0",
    description: "Starter backend with versioned API, validation, tests, and CI",
  },
  servers: [{ url: "/" }],
  paths: {
    "/api/v1/health": {
      get: {
        summary: "Health check",
        responses: {
          200: {
            description: "Service is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ok: { type: "boolean" },
                    service: { type: "string" },
                    time: { type: "string" },
                  },
                  required: ["ok", "service", "time"],
                },
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
              schema: {
                type: "object",
                properties: {
                  message: { type: "string", minLength: 1 },
                },
                required: ["message"],
              },
            },
          },
        },
        responses: {
          200: {
            description: "Echo response",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ok: { type: "boolean" },
                    message: { type: "string" },
                  },
                  required: ["ok", "message"],
                },
              },
            },
          },
          400: {
            description: "Validation error",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ok: { type: "boolean" },
                    error: { type: "string" },
                    details: { type: "array" },
                  },
                  required: ["ok", "error", "details"],
                },
              },
            },
          },
        },
      },
    },
  },
};

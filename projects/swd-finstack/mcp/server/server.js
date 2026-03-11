import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import dotenv from "dotenv";
import axios from "axios";
import winston from "winston";

// Load environment variables
dotenv.config();

// Configure logging
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "finstack-mcp.log" })
  ]
});

// Configuration
const CONFIG = {
  serverName: "swd-finstack-mcp-server",
  serverVersion: "1.0.0",
  maxRetries: 3,
  retryDelay: 1000,
  finstackApiUrl: process.env.FINSTACK_API_URL || "http://localhost:5000",
  finstackApiKey: process.env.FINSTACK_API_KEY || "swd-finstack-key"
};

// Helper functions
const logInfo = (message, data = {}) => {
  logger.info(message, data);
  console.error(JSON.stringify({ timestamp: new Date().toISOString(), level: "info", message, ...data }));
};

const logError = (message, error) => {
  logger.error(message, { error: error.message, stack: error.stack });
  console.error(JSON.stringify({ timestamp: new Date().toISOString(), level: "error", message, error: error.message }));
};

const validateInput = (input, schema) => {
  if (!input) return {};
  return input;
};

const retry = async (fn, retries = CONFIG.maxRetries) => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay));
      return retry(fn, retries - 1);
    }
    throw error;
  }
};

// API client for SWD-FINSTACK
const createApiClient = () => {
  return axios.create({
    baseURL: CONFIG.finstackApiUrl,
    headers: {
      "Authorization": `Bearer ${CONFIG.finstackApiKey}`,
      "Content-Type": "application/json"
    },
    timeout: 10000
  });
};

// Tools definitions
const tools = {
  // Financial Health Check
  financial_health_check: {
    type: "function",
    name: "financial_health_check",
    description: "Comprehensive financial health check for SWD-FINSTACK",
    inputSchema: {
      type: "object",
      properties: {
        includeSystemInfo: {
          type: "boolean",
          description: "Include system information in the health check"
        },
        includeMetrics: {
          type: "boolean", 
          description: "Include detailed metrics in the response"
        }
      },
      required: []
    }
  },

  // Invoice Management
  get_invoice_status: {
    type: "function",
    name: "get_invoice_status",
    description: "Get status of a specific invoice by ID or number",
    inputSchema: {
      type: "object",
      properties: {
        invoiceId: {
          type: "string",
          description: "Invoice ID (GUID)"
        },
        invoiceNumber: {
          type: "string",
          description: "Invoice number"
        }
      },
      required: []
    }
  },

  list_invoices: {
    type: "function", 
    name: "list_invoices",
    description: "List invoices with optional filtering",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["draft", "sent", "paid", "overdue", "cancelled"],
          description: "Filter by invoice status"
        },
        customerId: {
          type: "string",
          description: "Filter by customer ID"
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 100,
          description: "Maximum number of invoices to return"
        }
      },
      required: []
    }
  },

  // Payment Management
  get_payment_status: {
    type: "function",
    name: "get_payment_status",
    description: "Get status of a specific payment by ID",
    inputSchema: {
      type: "object",
      properties: {
        paymentId: {
          type: "string",
          description: "Payment ID (GUID)"
        }
      },
      required: ["paymentId"]
    }
  },

  list_payments: {
    type: "function",
    name: "list_payments",
    description: "List payments with optional filtering",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["pending", "completed", "failed", "refunded"],
          description: "Filter by payment status"
        },
        customerId: {
          type: "string",
          description: "Filter by customer ID"
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 100,
          description: "Maximum number of payments to return"
        }
      },
      required: []
    }
  },

  // Customer Management
  get_customer_info: {
    type: "function",
    name: "get_customer_info",
    description: "Get detailed information about a customer",
    inputSchema: {
      type: "object",
      properties: {
        customerId: {
          type: "string",
          description: "Customer ID (GUID)"
        },
        includeInvoices: {
          type: "boolean",
          description: "Include customer's invoices in the response"
        },
        includePayments: {
          type: "boolean",
          description: "Include customer's payments in the response"
        }
      },
      required: ["customerId"]
    }
  },

  // License Management
  get_license_status: {
    type: "function",
    name: "get_license_status",
    description: "Get license status for a customer or order",
    inputSchema: {
      type: "object",
      properties: {
        licenseId: {
          type: "string",
          description: "License ID (GUID)"
        },
        customerId: {
          type: "string",
          description: "Customer ID to get licenses for"
        },
        orderId: {
          type: "string",
          description: "Order ID to get associated licenses for"
        }
      },
      required: []
    }
  },

  // Audit and Compliance
  get_audit_trail: {
    type: "function",
    name: "get_audit_trail",
    description: "Get audit trail for financial operations",
    inputSchema: {
      type: "object",
      properties: {
        startDate: {
          type: "string",
          format: "date-time",
          description: "Start date for audit trail"
        },
        endDate: {
          type: "string", 
          format: "date-time",
          description: "End date for audit trail"
        },
        operationType: {
          type: "string",
          enum: ["invoice_create", "invoice_update", "payment_create", "payment_update", "license_create"],
          description: "Filter by operation type"
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 1000,
          description: "Maximum number of audit entries to return"
        }
      },
      required: []
    }
  },

  // Financial Metrics
  get_financial_metrics: {
    type: "function",
    name: "get_financial_metrics",
    description: "Get financial metrics and KPIs",
    inputSchema: {
      type: "object",
      properties: {
        period: {
          type: "string",
          enum: ["daily", "weekly", "monthly", "quarterly", "yearly"],
          description: "Time period for metrics"
        },
        startDate: {
          type: "string",
          format: "date-time",
          description: "Start date for metrics calculation"
        },
        endDate: {
          type: "string",
          format: "date-time", 
          description: "End date for metrics calculation"
        }
      },
      required: ["period"]
    }
  }
};

// Tool handlers
const toolHandlers = {
  async financial_health_check(request) {
    const input = validateInput(request.params?.input, tools.financial_health_check.inputSchema);
    const includeSystemInfo = input.includeSystemInfo || false;
    const includeMetrics = input.includeMetrics || false;

    try {
      const apiClient = createApiClient();
      
      // Check API connectivity
      const healthResponse = await retry(async () => {
        return await apiClient.get("/health");
      });

      const result = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        finstackApi: {
          status: healthResponse.status === 200 ? "online" : "offline",
          version: healthResponse.data?.version || "unknown",
          uptime: healthResponse.data?.uptime || "unknown"
        }
      };

      if (includeSystemInfo) {
        result.system = {
          nodeVersion: process.version,
          platform: process.platform,
          memoryUsage: process.memoryUsage(),
          uptime: process.uptime()
        };
      }

      if (includeMetrics) {
        try {
          const metricsResponse = await apiClient.get("/api/metrics");
          result.metrics = metricsResponse.data;
        } catch (error) {
          result.metrics = { error: "Unable to fetch metrics" };
        }
      }

      logInfo("Financial health check completed", { includeSystemInfo, includeMetrics });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      logError("Financial health check failed", error);
      throw new Error(`Health check failed: ${error.message}`);
    }
  },

  async get_invoice_status(request) {
    const input = validateInput(request.params?.input, tools.get_invoice_status.inputSchema);
    
    if (!input.invoiceId && !input.invoiceNumber) {
      throw new Error("Either invoiceId or invoiceNumber must be provided");
    }

    try {
      const apiClient = createApiClient();
      let response;

      if (input.invoiceId) {
        response = await retry(async () => {
          return await apiClient.get(`/api/invoices/${input.invoiceId}`);
        });
      } else {
        response = await retry(async () => {
          return await apiClient.get(`/api/invoices/number/${input.invoiceNumber}`);
        });
      }

      logInfo("Invoice status retrieved", { invoiceId: input.invoiceId, invoiceNumber: input.invoiceNumber });
      return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
    } catch (error) {
      logError("Failed to get invoice status", error);
      throw new Error(`Failed to get invoice status: ${error.message}`);
    }
  },

  async list_invoices(request) {
    const input = validateInput(request.params?.input, tools.list_invoices.inputSchema);
    
    try {
      const apiClient = createApiClient();
      const params = {};
      
      if (input.status) params.status = input.status;
      if (input.customerId) params.customerId = input.customerId;
      if (input.limit) params.limit = input.limit;

      const response = await retry(async () => {
        return await apiClient.get("/api/invoices", { params });
      });

      logInfo("Invoices listed", { filters: input });
      return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
    } catch (error) {
      logError("Failed to list invoices", error);
      throw new Error(`Failed to list invoices: ${error.message}`);
    }
  },

  async get_payment_status(request) {
    const input = validateInput(request.params?.input, tools.get_payment_status.inputSchema);
    
    if (!input.paymentId) {
      throw new Error("paymentId is required");
    }

    try {
      const apiClient = createApiClient();
      const response = await retry(async () => {
        return await apiClient.get(`/api/payments/${input.paymentId}`);
      });

      logInfo("Payment status retrieved", { paymentId: input.paymentId });
      return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
    } catch (error) {
      logError("Failed to get payment status", error);
      throw new Error(`Failed to get payment status: ${error.message}`);
    }
  },

  async list_payments(request) {
    const input = validateInput(request.params?.input, tools.list_payments.inputSchema);
    
    try {
      const apiClient = createApiClient();
      const params = {};
      
      if (input.status) params.status = input.status;
      if (input.customerId) params.customerId = input.customerId;
      if (input.limit) params.limit = input.limit;

      const response = await retry(async () => {
        return await apiClient.get("/api/payments", { params });
      });

      logInfo("Payments listed", { filters: input });
      return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
    } catch (error) {
      logError("Failed to list payments", error);
      throw new Error(`Failed to list payments: ${error.message}`);
    }
  },

  async get_customer_info(request) {
    const input = validateInput(request.params?.input, tools.get_customer_info.inputSchema);
    
    if (!input.customerId) {
      throw new Error("customerId is required");
    }

    try {
      const apiClient = createApiClient();
      const params = {};
      
      if (input.includeInvoices) params.includeInvoices = true;
      if (input.includePayments) params.includePayments = true;

      const response = await retry(async () => {
        return await apiClient.get(`/api/customers/${input.customerId}`, { params });
      });

      logInfo("Customer info retrieved", { customerId: input.customerId });
      return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
    } catch (error) {
      logError("Failed to get customer info", error);
      throw new Error(`Failed to get customer info: ${error.message}`);
    }
  },

  async get_license_status(request) {
    const input = validateInput(request.params?.input, tools.get_license_status.inputSchema);
    
    if (!input.licenseId && !input.customerId && !input.orderId) {
      throw new Error("At least one of licenseId, customerId, or orderId must be provided");
    }

    try {
      const apiClient = createApiClient();
      let response;

      if (input.licenseId) {
        response = await retry(async () => {
          return await apiClient.get(`/api/licenses/${input.licenseId}`);
        });
      } else if (input.customerId) {
        response = await retry(async () => {
          return await apiClient.get(`/api/licenses/customer/${input.customerId}`);
        });
      } else {
        response = await retry(async () => {
          return await apiClient.get(`/api/licenses/order/${input.orderId}`);
        });
      }

      logInfo("License status retrieved", { licenseId: input.licenseId, customerId: input.customerId, orderId: input.orderId });
      return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
    } catch (error) {
      logError("Failed to get license status", error);
      throw new Error(`Failed to get license status: ${error.message}`);
    }
  },

  async get_audit_trail(request) {
    const input = validateInput(request.params?.input, tools.get_audit_trail.inputSchema);
    
    try {
      const apiClient = createApiClient();
      const params = {};
      
      if (input.startDate) params.startDate = input.startDate;
      if (input.endDate) params.endDate = input.endDate;
      if (input.operationType) params.operationType = input.operationType;
      if (input.limit) params.limit = input.limit;

      const response = await retry(async () => {
        return await apiClient.get("/api/audit", { params });
      });

      logInfo("Audit trail retrieved", { filters: input });
      return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
    } catch (error) {
      logError("Failed to get audit trail", error);
      throw new Error(`Failed to get audit trail: ${error.message}`);
    }
  },

  async get_financial_metrics(request) {
    const input = validateInput(request.params?.input, tools.get_financial_metrics.inputSchema);
    
    if (!input.period) {
      throw new Error("period is required");
    }

    try {
      const apiClient = createApiClient();
      const params = { period: input.period };
      
      if (input.startDate) params.startDate = input.startDate;
      if (input.endDate) params.endDate = input.endDate;

      const response = await retry(async () => {
        return await apiClient.get("/api/metrics/financial", { params });
      });

      logInfo("Financial metrics retrieved", { period: input.period });
      return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
    } catch (error) {
      logError("Failed to get financial metrics", error);
      throw new Error(`Failed to get financial metrics: ${error.message}`);
    }
  }
};

// MCP Server setup
const server = new Server(
  {
    name: CONFIG.serverName,
    version: CONFIG.serverVersion,
  },
  {
    capabilities: {
      tools: {
        tools: Object.values(tools)
      },
    },
  }
);

// Server event handlers
server.setRequestHandler(async (request) => {
  switch (request.method) {
    case "tools/list":
      return {
        tools: Object.values(tools)
      };

    case "tools/call":
      const toolName = request.params?.name;
      const handler = toolHandlers[toolName];
      
      if (!handler) {
        throw new Error(`Unknown tool: ${toolName}`);
      }

      try {
        return await handler(request);
      } catch (error) {
        logError(`Tool ${toolName} failed`, error);
        throw error;
      }

    default:
      throw new Error(`Unsupported request method: ${request.method}`);
  }
});

// Graceful shutdown
const shutdown = (signal) => {
  logInfo(`Received ${signal}. Shutting down gracefully...`);
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGUSR2", () => shutdown("SIGUSR2"));

// Uncaught exception handling
process.on("uncaughtException", (error) => {
  logError("Uncaught exception", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logError("Unhandled promise rejection", new Error(String(reason)));
  process.exit(1);
});

// Start server
async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    logInfo(`SWD Finstack MCP Server started`, { 
      name: CONFIG.serverName, 
      version: CONFIG.serverVersion 
    });
  } catch (error) {
    logError("Failed to start server", error);
    process.exit(1);
  }
}

main();
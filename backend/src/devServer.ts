/**
 * Local Development Server
 *
 * Lightweight HTTP server that routes requests to Lambda handlers
 * without requiring Serverless Framework or AWS credentials.
 * Bypasses auth middleware for local development.
 *
 * Usage: npx tsx src/devServer.ts
 */

// Set env BEFORE any other imports so the service factory picks up mock mode
process.env.USE_MOCK_DATA = 'true';
process.env.NODE_ENV = 'development';

// Use require() to ensure env is set before module evaluation
const http = require('http') as typeof import('http');
// Trigger seed data initialization
require('./mock/seedData');
const { customerService, planService, billingService, paymentService, reportService } = require('./services');
const { httpResponse, paginatedResponse, successResponse, errorResponse } = require('./utils/response');
const { parsePaginationParams } = require('./utils/pagination');

const PORT = 4000;

interface RouteResult {
  statusCode: number;
  headers?: Record<string, any>;
  body: string;
}

interface Route {
  method: string;
  pattern: RegExp;
  handler: (params: Record<string, string>, query: Record<string, string>, body: any) => Promise<RouteResult>;
}

const routes: Route[] = [
  // Customers
  {
    method: 'GET',
    pattern: /^\/api\/v1\/customers$/,
    handler: async (_params, query) => {
      const pagination = parsePaginationParams(query);
      const filters = {
        status: query.status,
        service_area: query.service_area,
        plan_id: query.plan_id,
        search: query.search,
      };
      const result = await customerService.listCustomers(filters, pagination);
      return httpResponse(200, paginatedResponse(result));
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/v1\/customers\/(?<id>[^/]+)$/,
    handler: async (params) => {
      const result = await customerService.findCustomerById(params.id);
      return httpResponse(200, successResponse(result));
    },
  },
  {
    method: 'POST',
    pattern: /^\/api\/v1\/customers$/,
    handler: async (_params, _query, body) => {
      const result = await customerService.createCustomer(body);
      return httpResponse(201, successResponse(result));
    },
  },
  {
    method: 'PUT',
    pattern: /^\/api\/v1\/customers\/(?<id>[^/]+)$/,
    handler: async (params, _query, body) => {
      const result = await customerService.updateCustomer(params.id, body);
      return httpResponse(200, successResponse(result));
    },
  },
  {
    method: 'DELETE',
    pattern: /^\/api\/v1\/customers\/(?<id>[^/]+)$/,
    handler: async (params) => {
      await customerService.archiveCustomer(params.id);
      return httpResponse(200, successResponse({ message: 'Customer archived' }));
    },
  },
  {
    method: 'POST',
    pattern: /^\/api\/v1\/customers\/(?<id>[^/]+)\/restore$/,
    handler: async (params) => {
      const result = await customerService.restoreCustomer(params.id);
      return httpResponse(200, successResponse(result));
    },
  },

  // Plans
  {
    method: 'GET',
    pattern: /^\/api\/v1\/plans$/,
    handler: async (_params, query) => {
      const pagination = parsePaginationParams(query);
      const filters = { is_active: query.is_active };
      const result = await planService.listPlans(filters, pagination);
      return httpResponse(200, paginatedResponse(result));
    },
  },
  {
    method: 'POST',
    pattern: /^\/api\/v1\/plans$/,
    handler: async (_params, _query, body) => {
      const result = await planService.createPlan(body);
      return httpResponse(201, successResponse(result));
    },
  },
  {
    method: 'PUT',
    pattern: /^\/api\/v1\/plans\/(?<id>[^/]+)$/,
    handler: async (params, _query, body) => {
      const result = await planService.updatePlan(params.id, body);
      return httpResponse(200, successResponse(result));
    },
  },
  {
    method: 'PATCH',
    pattern: /^\/api\/v1\/plans\/(?<id>[^/]+)\/status$/,
    handler: async (params) => {
      const result = await planService.togglePlanStatus(params.id);
      return httpResponse(200, successResponse(result));
    },
  },

  // Billing - summary must come before :id to avoid matching "summary" as an id
  {
    method: 'GET',
    pattern: /^\/api\/v1\/billing\/summary$/,
    handler: async () => {
      const result = await billingService.getBillingSummary();
      return httpResponse(200, successResponse(result));
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/v1\/billing$/,
    handler: async (_params, query) => {
      const pagination = parsePaginationParams(query);
      const filters = {
        status: query.status,
        customer_id: query.customer_id,
        period_year: query.period_year ? parseInt(query.period_year) : undefined,
        period_month: query.period_month ? parseInt(query.period_month) : undefined,
      };
      const result = await billingService.listInvoices(filters, pagination);
      return httpResponse(200, paginatedResponse(result));
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/v1\/billing\/(?<id>[^/]+)$/,
    handler: async (params) => {
      const result = await billingService.getInvoice(params.id);
      return httpResponse(200, successResponse(result));
    },
  },
  {
    method: 'POST',
    pattern: /^\/api\/v1\/billing\/generate$/,
    handler: async (_params, _query, body) => {
      const result = await billingService.generateMonthlyInvoices(body.year, body.month);
      return httpResponse(201, successResponse(result));
    },
  },

  // Payments
  {
    method: 'GET',
    pattern: /^\/api\/v1\/payments$/,
    handler: async (_params, query) => {
      const pagination = parsePaginationParams(query);
      const filters = {
        customer_id: query.customer_id,
        method: query.method,
        date_from: query.date_from,
        date_to: query.date_to,
      };
      const result = await paymentService.listPayments(filters, pagination);
      return httpResponse(200, paginatedResponse(result));
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/v1\/payments\/(?<id>[^/]+)$/,
    handler: async (params) => {
      const result = await paymentService.getPayment(params.id);
      return httpResponse(200, successResponse(result));
    },
  },
  {
    method: 'POST',
    pattern: /^\/api\/v1\/payments$/,
    handler: async (_params, _query, body) => {
      const result = await paymentService.recordPayment(body);
      return httpResponse(201, successResponse(result));
    },
  },

  // Reports
  {
    method: 'GET',
    pattern: /^\/api\/v1\/reports\/dashboard$/,
    handler: async () => {
      const result = await reportService.getDashboardMetrics();
      return httpResponse(200, successResponse(result));
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/v1\/reports\/collections$/,
    handler: async (_params, query) => {
      const result = await reportService.getCollectionReport(query.from, query.to);
      return httpResponse(200, successResponse(result));
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/v1\/reports\/monthly$/,
    handler: async (_params, query) => {
      const year = query.year ? parseInt(query.year) : new Date().getFullYear();
      const result = await reportService.getMonthlyIncomeReport(year);
      return httpResponse(200, successResponse(result));
    },
  },
];

function parseUrl(url: string): { pathname: string; query: Record<string, string> } {
  const [pathname, queryString] = (url || '/').split('?');
  const query: Record<string, string> = {};
  if (queryString) {
    for (const pair of queryString.split('&')) {
      const [key, value] = pair.split('=');
      if (key) query[decodeURIComponent(key)] = decodeURIComponent(value || '');
    }
  }
  return { pathname, query };
}

function readBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const { pathname, query } = parseUrl(req.url || '/');
  const method = req.method || 'GET';

  // Find matching route
  for (const route of routes) {
    if (route.method !== method) continue;
    const match = pathname.match(route.pattern);
    if (!match) continue;

    const params = match.groups || {};
    const body = await readBody(req);

    try {
      const result = await route.handler(params, query, body);
      res.writeHead(result.statusCode, { 'Content-Type': 'application/json' });
      res.end(result.body);
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      const message = err.message || 'Internal server error';
      res.writeHead(statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(errorResponse(message)));
    }
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(errorResponse(`Route not found: ${method} ${pathname}`)));
});

server.listen(PORT, () => {
  console.log(`\n  🚀 ISP Billing API (Mock Mode) running at http://localhost:${PORT}`);
  console.log(`  📦 Using in-memory mock data (USE_MOCK_DATA=true)\n`);
  console.log(`  Available endpoints:`);
  console.log(`    GET    /api/v1/customers`);
  console.log(`    GET    /api/v1/customers/:id`);
  console.log(`    POST   /api/v1/customers`);
  console.log(`    PUT    /api/v1/customers/:id`);
  console.log(`    DELETE /api/v1/customers/:id`);
  console.log(`    POST   /api/v1/customers/:id/restore`);
  console.log(`    GET    /api/v1/plans`);
  console.log(`    POST   /api/v1/plans`);
  console.log(`    PUT    /api/v1/plans/:id`);
  console.log(`    PATCH  /api/v1/plans/:id/status`);
  console.log(`    GET    /api/v1/billing`);
  console.log(`    GET    /api/v1/billing/summary`);
  console.log(`    GET    /api/v1/billing/:id`);
  console.log(`    POST   /api/v1/billing/generate`);
  console.log(`    GET    /api/v1/payments`);
  console.log(`    GET    /api/v1/payments/:id`);
  console.log(`    POST   /api/v1/payments`);
  console.log(`    GET    /api/v1/reports/dashboard`);
  console.log(`    GET    /api/v1/reports/collections`);
  console.log(`    GET    /api/v1/reports/monthly`);
  console.log(`\n`);
});

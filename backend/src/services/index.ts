/**
 * Service Factory
 *
 * Resolves service implementations based on the USE_MOCK_DATA environment variable.
 * When USE_MOCK_DATA=true, mock in-memory services are used.
 * When USE_MOCK_DATA=false or unset, real Sequelize-based services are used.
 */

const useMock = process.env.USE_MOCK_DATA === 'true';

// Customer Service
export const customerService = useMock
  ? require('../mock/services/customerService')
  : require('./customerService');

// Plan Service
export const planService = useMock
  ? require('../mock/services/planService')
  : require('./planService');

// Billing Service
export const billingService = useMock
  ? require('../mock/services/billingService')
  : require('./billingService');

// Payment Service
export const paymentService = useMock
  ? require('../mock/services/paymentService')
  : require('./paymentService');

// Report Service
export const reportService = useMock
  ? require('../mock/services/reportService')
  : require('./reportService');

# Implementation Plan: ISP Billing System

## Overview

Incremental implementation of the ISP Billing System, starting with project scaffolding and database models, then building out services layer by layer, wiring up Lambda handlers, and finally connecting the Vue 3 frontend. Each task builds on the previous, ensuring no orphaned code.

## Tasks

- [x] 1. Project scaffolding and configuration
  - [x] 1.1 Initialize backend project with TypeScript, Serverless Framework, and dependencies
    - Create `backend/` directory with `package.json`, `tsconfig.json`, `serverless.yml`
    - Install core dependencies: sequelize, pg, zod, uuid, dayjs, middy, aws-sdk v3, aws-jwt-verify
    - Install dev dependencies: vitest, fast-check, serverless-offline, serverless-plugin-typescript
    - Configure Vitest in `vitest.config.ts`
    - _Requirements: 11.1, 11.2, 11.3_

  - [x] 1.2 Initialize frontend project with Vue 3, Vuetify, and dependencies
    - Create `frontend/` directory using Vite + Vue 3 + TypeScript template
    - Install: vuetify, pinia, vue-router, axios, amazon-cognito-identity-js, date-fns, zod, chart.js, vue-chartjs
    - Configure Vuetify plugin, Pinia, Vue Router
    - _Requirements: All frontend requirements_

  - [x] 1.3 Set up database configuration and Sequelize connection
    - Create `backend/src/config/database.ts` with connection config from environment variables
    - Create `backend/src/models/index.ts` with Sequelize instance initialization
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [x] 2. Database models and migrations
  - [x] 2.1 Create Sequelize models for all entities
    - Implement models: User, Customer, InternetPlan, Invoice, Payment, CustomerStatus, Notification, MikrotikLog, AuditLog, SystemSetting
    - All models use UUID v4 primary keys, paranoid mode (soft deletes), timestamps in UTC
    - Define associations (Customer belongsTo InternetPlan, Invoice belongsTo Customer, etc.)
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [x] 2.2 Create database migrations
    - Write migration files for all tables in correct dependency order
    - Include indexes on: account_number, email, mobile_number, status, created_at
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [ ]* 2.3 Write property tests for data models
    - **Property 18: Monetary values stored as integers**
    - **Property 19: Primary keys are valid UUID v4**
    - **Validates: Requirements 11.1, 11.3**

- [x] 3. Shared utilities and middleware
  - [x] 3.1 Implement shared utility functions
    - Create `backend/src/utils/response.ts` - standardized API response helpers
    - Create `backend/src/utils/pagination.ts` - pagination parameter parsing and response formatting
    - Create `backend/src/utils/currency.ts` - centavo conversion helpers
    - Create `backend/src/utils/date.ts` - UTC/Manila timezone helpers
    - Create `backend/src/utils/prorate.ts` - prorated billing calculation
    - _Requirements: 3.2, 11.1, 11.2_

  - [ ]* 3.2 Write property tests for proration calculation
    - **Property 7: Prorated amount calculation**
    - **Validates: Requirements 3.2**

  - [x] 3.3 Implement authentication middleware
    - Create `backend/src/middlewares/auth.ts` - JWT verification via aws-jwt-verify
    - Create `backend/src/middlewares/roleGuard.ts` - role-based access control
    - Create `backend/src/middlewares/errorHandler.ts` - global error handler
    - Create `backend/src/middlewares/validator.ts` - Zod schema validation wrapper
    - _Requirements: 9.3, 9.5, 9.6, 10.2_

  - [ ]* 3.4 Write property tests for RBAC middleware
    - **Property 17: Role-based access control enforcement**
    - **Validates: Requirements 9.3, 9.5, 9.6**

- [x] 4. Checkpoint - Core infrastructure
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Customer management service and handlers
  - [x] 5.1 Implement customer validation schemas
    - Create `backend/src/validators/customerSchema.ts` with Zod schemas for create/update
    - _Requirements: 1.1, 1.6_

  - [x] 5.2 Implement customer service
    - Create `backend/src/services/customerService.ts`
    - Implement: create, update, archive, restore, findById, list (with filters and pagination)
    - Generate unique account numbers on creation
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 5.3 Implement customer Lambda handlers
    - Create handlers: create, update, list, get, archive, restore
    - Wire middleware stack (auth, roleGuard, validator, errorHandler)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [ ]* 5.4 Write property tests for customer service
    - **Property 1: Customer creation produces valid record**
    - **Property 2: Archive-restore round-trip**
    - **Property 3: Filtered queries return only matching results** (customer portion)
    - **Validates: Requirements 1.1, 1.3, 1.4, 1.5**

  - [ ]* 5.5 Write property test for input validation
    - **Property 4: Invalid input rejection**
    - **Validates: Requirements 1.6, 2.6, 4.5**

- [x] 6. Internet plan management service and handlers
  - [x] 6.1 Implement plan validation schemas and service
    - Create `backend/src/validators/planSchema.ts`
    - Create `backend/src/services/planService.ts`
    - Implement: create, update, toggleStatus, list
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 6.2 Implement plan Lambda handlers
    - Create handlers: create, update, list, toggleStatus
    - Wire middleware stack
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ]* 6.3 Write property test for plan activation round-trip
    - **Property 5: Plan activation/deactivation round-trip**
    - **Validates: Requirements 2.3, 2.4**

- [x] 7. Billing and invoice service and handlers
  - [x] 7.1 Implement billing validation schemas and service
    - Create `backend/src/validators/billingSchema.ts`
    - Create `backend/src/services/billingService.ts`
    - Implement: generateMonthlyInvoices, calculateProratedAmount, getInvoice, listInvoices, updateInvoiceStatus, exportPdf
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [x] 7.2 Implement billing Lambda handlers
    - Create handlers: generate, list, get, exportPdf, summary
    - Wire middleware stack
    - _Requirements: 3.1, 3.3, 3.4_

  - [ ]* 7.3 Write property tests for billing service
    - **Property 6: Billing generation creates one invoice per active customer**
    - **Property 8: New invoices have Unpaid status**
    - **Property 9: Invoice status reflects total payments**
    - **Validates: Requirements 3.1, 3.5, 3.6, 3.7**

- [x] 8. Payment service and handlers
  - [x] 8.1 Implement payment validation schemas and service
    - Create `backend/src/validators/paymentSchema.ts`
    - Create `backend/src/services/paymentService.ts`
    - Implement: record (with invoice status update and reconnection trigger), getPayment, listPayments
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 8.2 Implement payment Lambda handlers
    - Create handlers: record, list, get
    - Wire middleware stack
    - _Requirements: 4.1, 4.4_

  - [ ]* 8.3 Write property tests for payment service
    - **Property 10: Payment recording persists all fields**
    - **Validates: Requirements 4.1, 4.3**

- [x] 9. Checkpoint - Core business logic
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Customer status management
  - [x] 10.1 Implement customer status service
    - Create `backend/src/services/customerStatusService.ts`
    - Implement: updateStatus, checkDueSoon, checkOverdue, logStatusChange
    - Create EventBridge-triggered handler for daily status checks
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ]* 10.2 Write property tests for status management
    - **Property 12: Customer status is always valid**
    - **Property 13: Status transitions based on due dates**
    - **Validates: Requirements 5.1, 5.2, 5.3**

- [x] 11. MikroTik integration service
  - [x] 11.1 Implement MikroTik service with enable/disable support
    - Create `backend/src/services/mikrotikService.ts`
    - Implement: isEnabled, setEnabled, disconnect, reconnect, syncStatus, getActiveSessions
    - All operations check enabled flag before executing
    - Create `backend/src/config/mikrotik.ts` for connection config
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.8, 7.9_

  - [x] 11.2 Implement MikroTik Lambda handlers
    - Create handlers: disconnect, reconnect, syncStatus, sessions, getSettings, updateSettings
    - Wire middleware stack
    - _Requirements: 7.3, 7.4, 7.6, 7.8_

  - [ ]* 11.3 Write property tests for MikroTik integration
    - **Property 11: Payment for disconnected customer triggers reconnection (when MikroTik enabled)**
    - **Validates: Requirements 4.6, 5.5, 7.2, 7.9**

- [x] 12. Notification service
  - [x] 12.1 Implement notification service
    - Create `backend/src/services/notificationService.ts`
    - Implement: sendDueReminder, sendOverdueNotice, sendPaymentConfirmation, sendDisconnectWarning, sendReconnectConfirmation, getNotificationLogs
    - Integrate with AWS SES (email) and Semaphore API (SMS)
    - Log all notifications to database
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [x] 12.2 Implement notification Lambda handlers and scheduled triggers
    - Create handlers: send, logs
    - Create EventBridge-triggered handler for scheduled reminders
    - _Requirements: 6.1, 6.2, 6.4_

  - [ ]* 12.3 Write property tests for notification logging
    - **Property 14: Operations produce audit log entries**
    - **Validates: Requirements 5.6, 6.7, 7.5, 9.4**

- [x] 13. Reports and dashboard service
  - [x] 13.1 Implement report service
    - Create `backend/src/services/reportService.ts`
    - Implement: getDashboardMetrics, getCollectionReport, getMonthlyIncomeReport, getOverdueReport
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 13.2 Implement report Lambda handlers
    - Create handlers: dashboard, collections, monthly
    - Wire middleware stack
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ]* 13.3 Write property tests for reports
    - **Property 15: Dashboard metrics correctness**
    - **Property 16: Collection report date range correctness**
    - **Validates: Requirements 8.1, 8.2**

- [x] 14. User management and audit logging
  - [x] 14.1 Implement user service with Cognito integration
    - Create `backend/src/services/userService.ts`
    - Implement: create (Cognito AdminCreateUser + group assignment), update, list, getActivityLogs
    - Create `backend/src/services/auditService.ts` for audit log recording
    - _Requirements: 9.1, 9.2, 9.4_

  - [x] 14.2 Implement user Lambda handlers
    - Create handlers: create, update, list, activityLogs
    - Wire middleware stack (Super Admin only)
    - _Requirements: 9.1, 9.2_

- [x] 15. Checkpoint - Backend complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 16. Serialization and data integrity
  - [ ]* 16.1 Write property tests for JSON serialization
    - **Property 20: JSON serialization round-trip**
    - **Validates: Requirements 11.5, 11.6**

- [x] 17. Frontend - Authentication and layout
  - [x] 17.1 Implement authentication module
    - Create `frontend/src/services/api.ts` - Axios instance with auth interceptors
    - Create `frontend/src/stores/auth.ts` - Pinia store for auth state
    - Create `frontend/src/composables/useAuth.ts` - Cognito login/logout/refresh
    - Create `frontend/src/views/auth/Login.vue`
    - Configure Vue Router guards for protected routes
    - _Requirements: 10.1, 10.3, 10.4, 10.5_

  - [x] 17.2 Implement app layout shell
    - Create `frontend/src/components/layout/AppSidebar.vue`
    - Create `frontend/src/components/layout/AppNavbar.vue`
    - Create `frontend/src/App.vue` with Vuetify layout
    - Configure router with nested routes
    - _Requirements: All frontend_

- [x] 18. Frontend - Customer management views
  - [x] 18.1 Implement customer views and components
    - Create `frontend/src/views/customers/CustomerList.vue` - data table with search/filter
    - Create `frontend/src/views/customers/CustomerCreate.vue` - form with validation
    - Create `frontend/src/views/customers/CustomerEdit.vue` - edit form
    - Create `frontend/src/views/customers/CustomerDetail.vue` - detail view with history
    - Create `frontend/src/stores/customers.ts` - Pinia store
    - Create `frontend/src/services/customerService.ts` - API calls
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 19. Frontend - Plans, billing, and payments views
  - [x] 19.1 Implement plan management views
    - Create `frontend/src/views/plans/PlanList.vue`
    - Create `frontend/src/views/plans/PlanForm.vue`
    - Create `frontend/src/stores/plans.ts`
    - Create `frontend/src/services/planService.ts`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 19.2 Implement billing views
    - Create `frontend/src/views/billing/InvoiceList.vue`
    - Create `frontend/src/views/billing/InvoiceDetail.vue`
    - Create `frontend/src/stores/billing.ts`
    - Create `frontend/src/services/billingService.ts`
    - _Requirements: 3.1, 3.3, 3.4_

  - [x] 19.3 Implement payment views
    - Create `frontend/src/views/payments/PaymentList.vue`
    - Create `frontend/src/views/payments/RecordPayment.vue`
    - Create `frontend/src/stores/payments.ts`
    - Create `frontend/src/services/paymentService.ts`
    - _Requirements: 4.1, 4.4_

- [x] 20. Frontend - Dashboard, reports, and settings
  - [x] 20.1 Implement dashboard view
    - Create `frontend/src/views/Dashboard.vue` with metric cards and charts
    - Create `frontend/src/components/reports/RevenueChart.vue`
    - Create `frontend/src/components/reports/RecentActivity.vue`
    - Create `frontend/src/services/reportService.ts`
    - _Requirements: 8.1, 8.5_

  - [x] 20.2 Implement report views
    - Create `frontend/src/views/reports/CollectionReport.vue`
    - Create `frontend/src/views/reports/MonthlyIncome.vue`
    - Create `frontend/src/views/reports/OverdueAccounts.vue`
    - _Requirements: 8.2, 8.3, 8.4_

  - [x] 20.3 Implement settings and MikroTik configuration views
    - Create `frontend/src/views/settings/UserManagement.vue`
    - Create `frontend/src/views/settings/MikrotikSettings.vue` - enable/disable toggle and connection config
    - Create `frontend/src/views/settings/NotificationSettings.vue`
    - _Requirements: 7.8, 7.9, 9.1, 9.2_

- [x] 21. Serverless deployment configuration
  - [x] 21.1 Complete serverless.yml with all function definitions
    - Define all Lambda functions with HTTP events
    - Configure EventBridge scheduled rules (daily billing, overdue check)
    - Set up VPC configuration for RDS access
    - Configure Cognito authorizer
    - Define environment variables and IAM roles
    - _Requirements: All_

- [x] 22. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using fast-check
- Unit tests validate specific examples and edge cases using Vitest
- Backend is built first to establish the API contract, then frontend consumes it

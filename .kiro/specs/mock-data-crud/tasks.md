# Implementation Plan: Mock Data CRUD

## Overview

Implement an in-memory mock data layer with at least 20 records per entity, full CRUD mock services, and a service factory for toggling between mock and real implementations.

## Tasks

- [x] 1. Create mock store and seed data
  - [x] 1.1 Create mock data types and store module (`backend/src/mock/store.ts`)
    - Define MockCustomer, MockPlan, MockInvoice, MockPayment, MockMikrotikLog, MockCustomerStatus interfaces
    - Export mutable store object with typed arrays
    - Include utility functions: generateId, generateAccountNumber, paginate, matchesSearch
    - _Requirements: 1.1, 1.3_

  - [x] 1.2 Create seed data (`backend/src/mock/seedData.ts`)
    - Generate 20+ customers across statuses (active, overdue, disconnected, suspended, reconnected)
    - Generate 6 internet plans (varying speeds/prices, one inactive)
    - Generate 20+ invoices (paid, unpaid, partial, overdue) linked to customers and plans
    - Generate 20+ payments with different methods (Cash, GCash, Maya, Bank transfer)
    - Generate related mikrotik_logs and customer_statuses entries
    - All IDs as UUID v4, monetary values in centavos, dates in ISO 8601
    - _Requirements: 1.2_

  - [ ]* 1.3 Write property tests for store utilities
    - **Property 1: Create assigns valid ID and timestamps**
    - **Property 13: Pagination correctness**
    - **Validates: Requirements 1.3, 2.1, 3.1, 4.1, 5.1**

- [x] 2. Implement mock customer service
  - [x] 2.1 Create mock customer service (`backend/src/mock/services/customerService.ts`)
    - Implement listCustomers with pagination, sorting, filtering (status, service_area, plan_id, search)
    - Implement createCustomer with account_number generation (ISP-YYYY-NNNN) and default active status
    - Implement updateCustomer with partial field update
    - Implement findCustomerById with plan association
    - Implement archiveCustomer (soft-delete) and restoreCustomer
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ]* 2.2 Write property tests for mock customer service
    - **Property 5: Customer list filtering correctness**
    - **Property 6: Customer account number format**
    - **Property 2: Partial update preserves unmodified fields**
    - **Property 3: Soft-delete and list exclusion**
    - **Property 4: Soft-delete then restore round-trip**
    - **Validates: Requirements 2.1, 2.2, 2.3, 1.4, 1.5, 1.6, 2.5, 2.6**

- [x] 3. Implement mock plan service
  - [x] 3.1 Create mock plan service (`backend/src/mock/services/planService.ts`)
    - Implement listPlans with pagination and is_active filtering
    - Implement createPlan with is_active defaulting to true
    - Implement updatePlan with partial field update
    - Implement togglePlanStatus
    - Implement findPlanById
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 3.2 Write unit tests for mock plan service
    - Test listing with active/inactive filter
    - Test create defaults is_active to true
    - Test toggle flips is_active
    - _Requirements: 3.1, 3.2, 3.4_

- [x] 4. Implement mock billing service
  - [x] 4.1 Create mock billing service (`backend/src/mock/services/billingService.ts`)
    - Implement listInvoices with pagination and filtering (status, customer_id, period_year, period_month)
    - Implement getInvoice with customer and plan associations
    - Implement generateMonthlyInvoices for active customers without existing invoices for the period
    - Implement recalculateInvoiceStatus (paid/partial/unchanged logic)
    - Implement getBillingSummary computing totals from invoice collection
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 4.2 Write property tests for mock billing service
    - **Property 8: Invoice generation for active customers**
    - **Property 9: Payment recording updates invoice status correctly**
    - **Validates: Requirements 4.3, 4.4, 5.2**

- [x] 5. Implement mock payment service
  - [x] 5.1 Create mock payment service (`backend/src/mock/services/paymentService.ts`)
    - Implement listPayments with pagination and filtering (customer_id, method, date range)
    - Implement recordPayment creating payment record and updating invoice status
    - Implement auto-reconnect logic for disconnected customers after payment
    - Implement getPayment with customer and invoice associations
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 5.2 Write property tests for mock payment service
    - **Property 10: Disconnected customer reconnection on payment**
    - **Validates: Requirements 5.3**

- [x] 6. Implement mock report service
  - [x] 6.1 Create mock report service (`backend/src/mock/services/reportService.ts`)
    - Implement getDashboardMetrics computing counts and totals from store state
    - Implement getCollectionReport filtering payments by date range
    - Implement getMonthlyIncomeReport aggregating payments by month
    - Implement getOverdueReport returning customers with overdue invoices
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]* 6.2 Write property tests for mock report service
    - **Property 11: Dashboard metrics consistency**
    - **Property 12: Collection report date range filtering**
    - **Validates: Requirements 6.1, 6.2**

- [x] 7. Implement service factory and wire up handlers
  - [x] 7.1 Create service factory (`backend/src/services/index.ts`)
    - Export all services resolved via USE_MOCK_DATA environment variable
    - When USE_MOCK_DATA=true, export mock service implementations
    - When USE_MOCK_DATA=false or unset, export real Sequelize-based services
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 7.2 Update handlers to import from service factory
    - Update customer handlers to use factory imports
    - Update plan handlers to use factory imports
    - Update billing handlers to use factory imports
    - Update payment handlers to use factory imports
    - Update report handlers to use factory imports
    - _Requirements: 7.3_

  - [x] 7.3 Add USE_MOCK_DATA=true to backend .env.example
    - _Requirements: 7.1_

- [x] 8. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- All monetary values stored in centavos (integer)
- Seed data uses Filipino names, Philippine addresses, and realistic ISP data

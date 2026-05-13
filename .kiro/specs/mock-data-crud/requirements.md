# Requirements Document

## Introduction

This feature adds an in-memory mock data layer to the backend API, replacing the Sequelize/PostgreSQL dependency during development. The mock layer implements the same service interfaces with full CRUD operations persisted in memory, enabling the backend to run via `serverless offline` without a database connection. This allows the full API stack (handlers, services, data) to be exercised realistically during frontend development.

## Glossary

- **Mock_Store**: An in-memory module that holds entity collections (arrays) and provides CRUD functions matching the existing service interfaces
- **Mock_Service**: A replacement service module that operates on the Mock_Store instead of Sequelize models
- **Handler**: An AWS Lambda function entry point that processes API Gateway events
- **Entity**: A data record (Customer, InternetPlan, Invoice, Payment, etc.)
- **Soft_Delete**: Setting a `deleted_at` timestamp instead of removing the record, excluding it from default queries

## Requirements

### Requirement 1: In-Memory Mock Store

**User Story:** As a developer, I want the backend API to serve realistic data from memory without a database, so that I can develop and test the full application flow locally.

#### Acceptance Criteria

1. THE Mock_Store SHALL maintain separate in-memory arrays for customers, plans, invoices, payments, mikrotik_logs, and customer_statuses
2. WHEN the backend starts, THE Mock_Store SHALL initialize with seed data containing at least 20 customers, 6 plans, 20 invoices, and 20 payments
3. WHEN a create operation is performed, THE Mock_Store SHALL assign a UUID v4 as the entity ID and set created_at and updated_at timestamps
4. WHEN an update operation is performed, THE Mock_Store SHALL modify only the specified fields and update the updated_at timestamp
5. WHEN a soft-delete operation is performed, THE Mock_Store SHALL set the deleted_at timestamp and exclude the entity from default list queries
6. WHEN a restore operation is performed, THE Mock_Store SHALL clear the deleted_at field

### Requirement 2: Mock Customer Service

**User Story:** As a developer, I want mock customer CRUD operations that match the real customerService interface, so that handlers work without code changes.

#### Acceptance Criteria

1. WHEN listing customers, THE Mock_Service SHALL support pagination, sorting, and filtering by status, service_area, plan_id, and search term
2. WHEN searching customers, THE Mock_Service SHALL match against full_name, account_number, mobile_number, and email (case-insensitive)
3. WHEN creating a customer, THE Mock_Service SHALL generate a sequential account_number in the format ISP-YYYY-NNNN and set status to active
4. WHEN fetching a single customer, THE Mock_Service SHALL include the associated plan object
5. WHEN archiving a customer, THE Mock_Service SHALL soft-delete the record
6. WHEN restoring a customer, THE Mock_Service SHALL clear deleted_at and return the customer with its plan

### Requirement 3: Mock Plan Service

**User Story:** As a developer, I want mock plan CRUD operations that match the real planService interface, so that plan management works without a database.

#### Acceptance Criteria

1. WHEN listing plans, THE Mock_Service SHALL support pagination and filtering by is_active status
2. WHEN creating a plan, THE Mock_Service SHALL default is_active to true
3. WHEN updating a plan, THE Mock_Service SHALL modify only the provided fields
4. WHEN toggling plan status, THE Mock_Service SHALL update the is_active field

### Requirement 4: Mock Billing Service

**User Story:** As a developer, I want mock billing operations that match the real billingService interface, so that invoice flows work without a database.

#### Acceptance Criteria

1. WHEN listing invoices, THE Mock_Service SHALL support pagination and filtering by status, customer_id, period_year, and period_month
2. WHEN fetching a single invoice, THE Mock_Service SHALL include associated customer and plan objects
3. WHEN generating monthly invoices, THE Mock_Service SHALL create unpaid invoices for all active customers that do not already have an invoice for the specified period
4. WHEN a payment updates an invoice, THE Mock_Service SHALL recalculate paid_amount and set status to paid, partial, or keep existing status based on total payments
5. WHEN fetching a billing summary, THE Mock_Service SHALL compute totals from the current invoice collection

### Requirement 5: Mock Payment Service

**User Story:** As a developer, I want mock payment operations that match the real paymentService interface, so that payment recording works without a database.

#### Acceptance Criteria

1. WHEN listing payments, THE Mock_Service SHALL support pagination and filtering by customer_id, method, and date range
2. WHEN recording a payment, THE Mock_Service SHALL create the payment record and update the associated invoice paid_amount and status
3. IF the customer status is disconnected after payment, THEN THE Mock_Service SHALL update the customer status to reconnected
4. WHEN fetching a single payment, THE Mock_Service SHALL include associated customer and invoice objects

### Requirement 6: Mock Report Service

**User Story:** As a developer, I want mock report endpoints to compute metrics from the in-memory store, so that the dashboard reflects current mock data state.

#### Acceptance Criteria

1. WHEN fetching dashboard metrics, THE Mock_Service SHALL compute active/overdue/disconnected counts, daily collections, monthly revenue, and recent activity from the current store state
2. WHEN fetching the collection report, THE Mock_Service SHALL filter payments by the provided date range and compute totals
3. WHEN fetching the monthly income report, THE Mock_Service SHALL aggregate payments by month for the requested year
4. WHEN fetching the overdue report, THE Mock_Service SHALL return customers with overdue invoices and compute outstanding amounts

### Requirement 7: Service Switching Mechanism

**User Story:** As a developer, I want to switch between mock and real services via an environment variable, so that I can toggle without code changes.

#### Acceptance Criteria

1. WHEN the environment variable USE_MOCK_DATA is set to true, THE Handler SHALL use Mock_Service implementations instead of real Sequelize-based services
2. WHEN USE_MOCK_DATA is false or unset, THE Handler SHALL use the real Sequelize-based services
3. THE switching mechanism SHALL require no changes to handler code beyond an import path or factory function

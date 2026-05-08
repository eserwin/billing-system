# Requirements Document

## Introduction

The ISP Billing System is a web-based application for managing customer lifecycle, billing automation, payment processing, MikroTik router integration, and administrative operations for a local internet service provider in the Philippines. The system provides an admin dashboard for managing customers, generating invoices, recording payments, and automating service disconnection/reconnection based on payment status.

## Glossary

- **System**: The ISP Billing System application (frontend + backend + database)
- **Admin_Dashboard**: The Vue 3 + Vuetify single-page application used by administrators
- **API**: The serverless backend providing RESTful endpoints
- **Customer**: A subscriber of the ISP's internet service
- **Internet_Plan**: A service package with defined speed and monthly fee
- **Invoice**: A billing record generated for a customer for a billing period
- **Payment**: A recorded transaction from a customer toward an invoice
- **MikroTik_Service**: The integration layer communicating with MikroTik RouterOS API
- **Notification_Service**: The module responsible for sending SMS and email notifications
- **Cashier**: A user role with limited permissions (record payments only)
- **Admin**: A user role with permissions to manage plans, customers, billing, and reports
- **Super_Admin**: A user role with full system access including user management and backups

## Requirements

### Requirement 1: Customer Management

**User Story:** As an Admin, I want to manage customer records, so that I can maintain an accurate database of all ISP subscribers.

#### Acceptance Criteria

1. WHEN an Admin submits a valid customer form, THE API SHALL create a new customer record with a unique account number and return the created customer data
2. WHEN an Admin updates customer details, THE API SHALL persist the changes and return the updated customer record
3. WHEN an Admin archives a customer, THE API SHALL soft-delete the customer record by setting the deleted_at timestamp
4. WHEN an Admin restores an archived customer, THE API SHALL clear the deleted_at timestamp and make the customer active again
5. WHEN an Admin searches customers with filter criteria, THE API SHALL return paginated results matching the provided filters
6. IF a customer form is submitted with missing required fields, THEN THE API SHALL reject the request with a descriptive validation error

### Requirement 2: Internet Plan Management

**User Story:** As an Admin, I want to manage internet plans, so that I can define the service packages available to customers.

#### Acceptance Criteria

1. WHEN an Admin creates a new internet plan with valid data, THE API SHALL store the plan and return the created plan record
2. WHEN an Admin updates an existing plan, THE API SHALL persist the changes and return the updated plan
3. WHEN an Admin deactivates a plan, THE API SHALL mark the plan as inactive and exclude it from new customer assignments
4. WHEN an Admin activates a plan, THE API SHALL mark the plan as active and make it available for assignment
5. THE API SHALL return a paginated list of internet plans when requested
6. IF a plan creation request contains invalid data, THEN THE API SHALL reject it with specific validation errors

### Requirement 3: Billing and Invoice Management

**User Story:** As an Admin, I want automated billing generation, so that invoices are created consistently each billing cycle without manual intervention.

#### Acceptance Criteria

1. WHEN the billing generation process runs, THE API SHALL create invoices for all active customers based on their assigned internet plan and billing cycle
2. WHEN a customer was disconnected for N days during a billing period, THE API SHALL calculate the prorated amount as (monthly_fee / 30) × (30 - N)
3. WHEN an Admin requests an invoice PDF, THE API SHALL generate a PDF document containing invoice details and return it
4. WHEN an Admin queries invoices with filters, THE API SHALL return paginated invoice records matching the criteria
5. THE API SHALL assign each invoice a status of Unpaid upon creation
6. WHEN a payment fully covers an invoice amount, THE API SHALL update the invoice status to Paid
7. WHEN a payment partially covers an invoice amount, THE API SHALL update the invoice status to Partial
8. WHEN an invoice due date passes without full payment, THE API SHALL mark the invoice as Overdue

### Requirement 4: Payment Management

**User Story:** As a Cashier, I want to record customer payments, so that customer accounts are updated and services can be maintained.

#### Acceptance Criteria

1. WHEN a Cashier records a payment with valid data, THE API SHALL create a payment record linked to the customer and invoice
2. WHEN a payment is recorded, THE API SHALL update the associated invoice status based on the total amount paid
3. THE API SHALL store the payment method, reference number, receiver, payment date, and notes for each payment
4. WHEN an Admin queries payments with filters, THE API SHALL return paginated payment records matching the criteria
5. IF a payment record request contains invalid data, THEN THE API SHALL reject it with specific validation errors
6. WHEN a payment is recorded for a disconnected customer, THE API SHALL trigger the reconnection process

### Requirement 5: Customer Status Management

**User Story:** As an Admin, I want to track customer connection statuses, so that I can monitor service delivery and take action on overdue accounts.

#### Acceptance Criteria

1. THE System SHALL maintain customer statuses as one of: Active, Due_Soon, Overdue, Disconnected, Reconnected, Suspended
2. WHEN a customer's invoice due date is within 3 days, THE System SHALL update the customer status to Due_Soon
3. WHEN a customer's invoice due date passes without payment, THE System SHALL update the customer status to Overdue
4. WHEN a customer is disconnected from the network, THE System SHALL update the customer status to Disconnected and record the timestamp
5. WHEN a disconnected customer's payment is confirmed, THE System SHALL update the customer status to Reconnected and record the timestamp
6. WHEN a status change occurs, THE System SHALL create an audit log entry with the previous status, new status, and timestamp

### Requirement 6: Notification and Reminder System

**User Story:** As an Admin, I want automated notifications sent to customers, so that they are informed about billing events and service changes.

#### Acceptance Criteria

1. WHEN a customer's invoice due date is 3 days away, THE Notification_Service SHALL send a due date reminder via SMS and email
2. WHEN a customer's invoice becomes overdue, THE Notification_Service SHALL send an overdue notice via SMS and email
3. WHEN a payment is confirmed, THE Notification_Service SHALL send a payment confirmation to the customer
4. WHEN a customer is about to be disconnected (1 day before), THE Notification_Service SHALL send a disconnection warning
5. WHEN a customer is reconnected, THE Notification_Service SHALL send a reconnection confirmation
6. IF a notification fails to send, THEN THE Notification_Service SHALL log the failure and notify the Admin
7. THE Notification_Service SHALL log all sent notifications with timestamp, channel, recipient, and status

### Requirement 7: MikroTik Integration

**User Story:** As an Admin, I want the system to optionally manage customer connections via MikroTik, so that overdue customers are disconnected and paying customers are reconnected without manual intervention when the feature is enabled.

#### Acceptance Criteria

1. WHERE MikroTik integration is enabled, WHEN a customer is overdue beyond the configured threshold days, THE MikroTik_Service SHALL disconnect the customer from the network
2. WHERE MikroTik integration is enabled, WHEN a disconnected customer's payment is confirmed, THE MikroTik_Service SHALL reconnect the customer to the network
3. WHERE MikroTik integration is enabled, WHEN an Admin manually triggers a disconnect, THE MikroTik_Service SHALL disconnect the specified customer and log the action
4. WHERE MikroTik integration is enabled, WHEN an Admin manually triggers a reconnect, THE MikroTik_Service SHALL reconnect the specified customer and log the action
5. WHERE MikroTik integration is enabled, THE MikroTik_Service SHALL log all disconnect and reconnect operations with timestamps and device information
6. WHERE MikroTik integration is enabled, WHEN the MikroTik_Service syncs connection status, THE System SHALL update customer records to reflect actual network state
7. IF a MikroTik operation fails, THEN THE MikroTik_Service SHALL log the error and notify the Admin
8. WHEN an Admin enables or disables MikroTik integration, THE System SHALL persist the setting and immediately apply the change to all automated processes
9. WHILE MikroTik integration is disabled, THE System SHALL skip all automated disconnect and reconnect operations and allow manual status management only

### Requirement 8: Reports and Dashboard

**User Story:** As an Admin, I want a dashboard with reports, so that I can monitor business performance and make informed decisions.

#### Acceptance Criteria

1. WHEN an Admin loads the dashboard, THE API SHALL return aggregated metrics including total active customers, total overdue, total disconnected, daily collections, and monthly revenue
2. WHEN an Admin requests a collection report for a date range, THE API SHALL return itemized payment records with totals
3. WHEN an Admin requests a monthly income report, THE API SHALL return revenue data grouped by month
4. WHEN an Admin requests an overdue accounts report, THE API SHALL return all customers with overdue invoices and their outstanding amounts
5. THE API SHALL return recent payments and recent disconnect/reconnect events for the dashboard

### Requirement 9: User and Access Management

**User Story:** As a Super Admin, I want to manage system users and their roles, so that access is controlled and actions are auditable.

#### Acceptance Criteria

1. WHEN a Super Admin creates a new user, THE API SHALL create the user in Cognito with the specified role group
2. WHEN a Super Admin updates a user's role, THE API SHALL update the Cognito group membership accordingly
3. THE API SHALL enforce role-based access control on all endpoints based on the authenticated user's Cognito group
4. WHEN any user performs a significant action, THE System SHALL record an audit log entry with user ID, action, target, and timestamp
5. IF an unauthenticated request is made to a protected endpoint, THEN THE API SHALL return a 401 Unauthorized response
6. IF an authenticated user requests a resource beyond their role permissions, THEN THE API SHALL return a 403 Forbidden response

### Requirement 10: Authentication

**User Story:** As a user, I want to securely log in to the system, so that my identity is verified and my session is managed.

#### Acceptance Criteria

1. WHEN a user submits valid credentials, THE System SHALL authenticate via Cognito and return access, ID, and refresh tokens
2. WHEN a valid access token is provided in the Authorization header, THE API SHALL process the request for the authenticated user
3. WHEN an access token expires, THE System SHALL use the refresh token to obtain new tokens without requiring re-login
4. WHEN a user logs out, THE System SHALL invalidate the session tokens
5. IF invalid credentials are submitted, THEN THE System SHALL return an authentication error without revealing which field is incorrect
6. THE System SHALL enforce Cognito password policy: minimum 8 characters, uppercase, lowercase, number, and special character

### Requirement 11: Data Persistence and Integrity

**User Story:** As a system architect, I want data stored reliably with proper integrity constraints, so that the system maintains consistency and supports recovery.

#### Acceptance Criteria

1. THE System SHALL store all monetary values as integers in centavos to avoid floating-point precision errors
2. THE System SHALL store all timestamps in UTC and display them in Asia/Manila timezone
3. THE System SHALL use UUID v4 for all primary keys
4. THE System SHALL implement soft deletes via a deleted_at column on all primary entities
5. WHEN serializing a customer record to JSON, THE API SHALL produce a valid JSON representation that can be deserialized back to an equivalent record
6. WHEN serializing an invoice record to JSON, THE API SHALL produce a valid JSON representation that can be deserialized back to an equivalent record

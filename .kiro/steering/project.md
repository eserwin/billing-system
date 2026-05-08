# ISP Billing System - Project Steering

## Project Overview

This is an ISP (Internet Service Provider) Billing and Customer Management System. It handles customer lifecycle management, billing automation, payment processing, MikroTik router integration, and administrative operations for a local internet service provider.

## Architecture

- Frontend: Vue 3 + Vuetify
- Backend: Node.js + TypeScript (Serverless Framework) with Sequelize ORM
- Database: PostgreSQL
- Authentication: JWT
- Cloud: AWS (serverless deployment)
- MikroTik Integration: RouterOS API
- Notifications: SMS and Email services

### Architecture Flow

```
Admin Dashboard (Vue 3) → Backend API (Serverless) → PostgreSQL
                                    ↓
                              MikroTik API
                                    ↓
                           SMS / Email Service
```

## Core Modules

### 1. Customer Management
- Add, update, archive, and restore customer records
- Fields: full name, address, mobile number, email, account number, installation location, service area/barangay, internet plan, installation date, service status
- Upload customer documents
- Search and filter customers
- View customer history (payments, disconnection, reconnection, plan changes)

### 2. Internet Plan Management
- Create and manage internet plans
- Fields: plan name, speed/package, monthly fee, installation fee
- Activate or deactivate plans

### 3. Billing and Invoice Management
- Auto-generate monthly billing
- Generate invoices and receipts
- Statuses: Paid, Unpaid, Partial payment, Overdue
- Prorated billing computation:
  - Daily rate = monthly_fee / 30
  - If disconnected for N days: amount = (monthly_fee / 30) × (30 - N)
- Export invoices to PDF
- Generate billing summaries

### 4. Payment Management
- Record customer payments
- Payment methods: Cash, GCash, Maya, Bank transfer
- Store: reference number, receiver/cashier, payment date/time, notes
- Update account status after payment

### 5. Customer Status Management
- Statuses: Active, Due Soon, Overdue, Disconnected, Reconnected, Suspended
- Save timestamps for: disconnect, reconnect, payment
- Maintain audit logs

### 6. Notification and Reminder System
- Channels: SMS, Email
- Reminder types: due date reminder, overdue notice, payment confirmation, disconnection warning, reconnection confirmation
- Admin notifications: customer disconnected/reconnected, payment received, failed SMS/email

### 7. MikroTik Integration
- Integrate with MikroTik RouterOS API
- Auto disconnect overdue customers
- Auto reconnect paid customers
- Sync customer connection status
- Store: disconnect/reconnect timestamps, router/device information
- Detect active/inactive sessions
- Manual reconnect/disconnect override by admin

### 8. Reports and Dashboard
- Dashboard widgets: total active customers, total overdue, total disconnected, daily collections, monthly revenue, recent payments, recent disconnect/reconnect
- Reports: due accounts, paid/unpaid accounts, disconnected/reconnected customers, collection reports, monthly income, payment history, notification logs

### 9. Admin and User Management
- Admin login only (no public registration)
- Multi-user support
- Roles: Super Admin, Admin, Cashier
- Activity logs

### 10. Security
- Encrypted passwords (bcrypt)
- HTTPS/SSL
- Secure API authentication (JWT)
- Audit logging
- Database backup and restore
- IP restriction for admin panel

### 11. Cloud and Infrastructure
- Cloud deployment on AWS
- Domain setup with SSL certificate
- Serverless API (AWS Lambda)
- Frontend hosted on S3/CloudFront
- Monitoring and alerts (CloudWatch)

## Coding Standards

### Backend (Node.js + TypeScript)
- Use TypeScript strict mode
- Follow RESTful API conventions
- Use Sequelize models with migrations
- Validate all inputs with a validation library (e.g., Joi or Zod)
- Use environment variables for configuration
- Structure: handlers, services, models, middlewares, utils
- Error responses follow a consistent format: `{ success: false, message: string, errors?: [] }`
- Success responses: `{ success: true, data: any, meta?: {} }`

### Frontend (Vue 3 + Vuetify)
- Use Composition API with `<script setup>`
- Use Pinia for state management
- Use Vue Router with route guards for auth
- Component naming: PascalCase
- File structure: views, components, composables, stores, services, utils
- Use Vuetify components for UI consistency
- Currency format: Philippine Peso (₱)
- Date format: YYYY-MM-DD or readable Filipino format

### Database (PostgreSQL)
- Use Sequelize migrations for schema changes
- Use snake_case for table and column names
- Always include: id, created_at, updated_at, deleted_at (soft delete)
- Use UUIDs for primary keys
- Index frequently queried columns

### General
- All monetary values stored as integers (centavos) to avoid floating point issues
- Timestamps in UTC, display in Asia/Manila timezone
- API versioning: /api/v1/
- Pagination on all list endpoints
- Soft delete by default (archive, not destroy)

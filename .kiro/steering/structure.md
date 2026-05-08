# Project Structure

## Root Layout

```
billing-system/
├── frontend/                # Vue 3 + Vuetify SPA
├── backend/                 # Node.js + TypeScript Serverless API
├── database/                # Migrations, seeders, schema docs
├── docs/                    # Project documentation
├── .kiro/                   # Kiro steering files
└── README.md
```

## Frontend Structure (Vue 3 + Vuetify)

```
frontend/
├── public/
├── src/
│   ├── assets/              # Static assets (images, fonts)
│   ├── components/          # Reusable UI components
│   │   ├── common/          # Shared components (DataTable, Modal, StatusBadge)
│   │   ├── customers/       # Customer-specific components
│   │   ├── billing/         # Billing/invoice components
│   │   ├── payments/        # Payment components
│   │   ├── plans/           # Internet plan components
│   │   ├── reports/         # Report/chart components
│   │   └── layout/          # App shell (Sidebar, Navbar, Footer)
│   ├── composables/         # Reusable composition functions
│   │   ├── useAuth.ts
│   │   ├── useCustomers.ts
│   │   ├── useBilling.ts
│   │   ├── usePayments.ts
│   │   ├── useNotifications.ts
│   │   └── usePagination.ts
│   ├── views/               # Page-level components (routed)
│   │   ├── Dashboard.vue
│   │   ├── customers/
│   │   ├── billing/
│   │   ├── payments/
│   │   ├── plans/
│   │   ├── reports/
│   │   ├── settings/
│   │   └── auth/
│   ├── stores/              # Pinia state management
│   │   ├── auth.ts
│   │   ├── customers.ts
│   │   ├── billing.ts
│   │   ├── payments.ts
│   │   └── plans.ts
│   ├── services/            # API client and service layer
│   │   ├── api.ts           # Axios instance with interceptors
│   │   ├── customerService.ts
│   │   ├── billingService.ts
│   │   ├── paymentService.ts
│   │   ├── planService.ts
│   │   └── reportService.ts
│   ├── router/              # Vue Router config
│   │   └── index.ts
│   ├── plugins/             # Vuetify, Pinia plugin setup
│   ├── utils/               # Helpers (formatCurrency, formatDate, etc.)
│   ├── types/               # TypeScript interfaces and types
│   ├── App.vue
│   └── main.ts
├── .env
├── .env.production
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Backend Structure (Serverless + TypeScript)

```
backend/
├── src/
│   ├── handlers/            # Lambda function entry points
│   │   ├── auth/
│   │   │   ├── login.ts
│   │   │   ├── logout.ts
│   │   │   └── refreshToken.ts
│   │   ├── customers/
│   │   │   ├── create.ts
│   │   │   ├── update.ts
│   │   │   ├── list.ts
│   │   │   ├── get.ts
│   │   │   ├── archive.ts
│   │   │   └── restore.ts
│   │   ├── plans/
│   │   │   ├── create.ts
│   │   │   ├── update.ts
│   │   │   ├── list.ts
│   │   │   └── toggleStatus.ts
│   │   ├── billing/
│   │   │   ├── generate.ts
│   │   │   ├── list.ts
│   │   │   ├── get.ts
│   │   │   ├── exportPdf.ts
│   │   │   └── summary.ts
│   │   ├── payments/
│   │   │   ├── record.ts
│   │   │   ├── list.ts
│   │   │   └── get.ts
│   │   ├── mikrotik/
│   │   │   ├── disconnect.ts
│   │   │   ├── reconnect.ts
│   │   │   ├── syncStatus.ts
│   │   │   └── sessions.ts
│   │   ├── notifications/
│   │   │   ├── send.ts
│   │   │   └── logs.ts
│   │   ├── reports/
│   │   │   ├── dashboard.ts
│   │   │   ├── collections.ts
│   │   │   └── monthly.ts
│   │   └── users/
│   │       ├── create.ts
│   │       ├── update.ts
│   │       ├── list.ts
│   │       └── activityLogs.ts
│   ├── services/            # Business logic layer
│   │   ├── customerService.ts
│   │   ├── billingService.ts
│   │   ├── paymentService.ts
│   │   ├── planService.ts
│   │   ├── mikrotikService.ts
│   │   ├── notificationService.ts
│   │   ├── reportService.ts
│   │   └── userService.ts
│   ├── models/              # Sequelize models
│   │   ├── index.ts         # Sequelize instance and model registry
│   │   ├── Customer.ts
│   │   ├── InternetPlan.ts
│   │   ├── Invoice.ts
│   │   ├── Payment.ts
│   │   ├── CustomerStatus.ts
│   │   ├── Notification.ts
│   │   ├── MikrotikLog.ts
│   │   ├── User.ts
│   │   └── AuditLog.ts
│   ├── middlewares/         # Middleware functions
│   │   ├── auth.ts          # JWT verification
│   │   ├── roleGuard.ts     # Role-based access control
│   │   ├── validator.ts     # Request validation wrapper
│   │   └── errorHandler.ts  # Global error handler
│   ├── validators/          # Zod/Joi schemas
│   │   ├── customerSchema.ts
│   │   ├── billingSchema.ts
│   │   ├── paymentSchema.ts
│   │   └── planSchema.ts
│   ├── utils/               # Utility functions
│   │   ├── response.ts      # Standardized API responses
│   │   ├── pagination.ts    # Pagination helper
│   │   ├── prorate.ts       # Prorated billing calculator
│   │   ├── currency.ts      # Centavo conversion helpers
│   │   └── date.ts          # Date/timezone helpers
│   ├── config/              # App configuration
│   │   ├── database.ts
│   │   ├── jwt.ts
│   │   └── mikrotik.ts
│   └── types/               # Shared TypeScript types
│       ├── customer.ts
│       ├── billing.ts
│       ├── payment.ts
│       └── common.ts
├── serverless.yml           # Serverless Framework config
├── tsconfig.json
├── package.json
└── .env.example
```

## Database Structure

```
database/
├── migrations/              # Sequelize migrations (timestamped)
│   ├── 001-create-users.ts
│   ├── 002-create-internet-plans.ts
│   ├── 003-create-customers.ts
│   ├── 004-create-invoices.ts
│   ├── 005-create-payments.ts
│   ├── 006-create-customer-statuses.ts
│   ├── 007-create-notifications.ts
│   ├── 008-create-mikrotik-logs.ts
│   └── 009-create-audit-logs.ts
├── seeders/                 # Test/default data
│   ├── admin-user.ts
│   └── default-plans.ts
└── schema.md                # ERD documentation
```

## Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Files (backend) | camelCase | customerService.ts |
| Files (frontend components) | PascalCase | CustomerList.vue |
| Files (frontend other) | camelCase | useCustomers.ts |
| Database tables | snake_case, plural | internet_plans |
| Database columns | snake_case | monthly_fee |
| API endpoints | kebab-case, plural | /api/v1/internet-plans |
| Environment variables | UPPER_SNAKE_CASE | DATABASE_URL |
| TypeScript interfaces | PascalCase, prefixed I | ICustomer |
| TypeScript types | PascalCase | PaymentMethod |

# Technology Stack & Configuration

## Frontend

### Core
- Vue 3.4+ (Composition API only)
- Vuetify 3 (Material Design component library)
- Vite 5+ (build tool)
- TypeScript 5+
- Pinia (state management)
- Vue Router 4

### Libraries
- Axios (HTTP client with interceptors for auth)
- amazon-cognito-identity-js (Cognito authentication SDK)
- date-fns (date formatting, timezone: Asia/Manila)
- chart.js + vue-chartjs (dashboard charts)
- jspdf + jspdf-autotable (PDF export on client if needed)
- vee-validate + zod (form validation)
- vue-toastification (toast notifications)

### Dev Tools
- ESLint + Prettier (code formatting)
- Vitest (unit testing)
- Playwright (E2E testing, optional)

---

## Backend

### Core
- Node.js 24 LTS
- TypeScript 5+ (strict mode enabled)
- Serverless Framework 3+ (AWS Lambda deployment)
- Sequelize 6 (ORM with PostgreSQL dialect)

### Libraries
- zod (request validation)
- aws-jwt-verify (Cognito JWT token verification)
- uuid (UUID generation for primary keys)
- dayjs (date manipulation, UTC storage)
- routeros-client (MikroTik RouterOS API)
- nodemailer (email notifications)
- aws-sdk v3 (S3, SES, SNS, Cognito Identity Provider)
- pdfkit or puppeteer-core (server-side PDF generation)
- middy (Lambda middleware engine)

### Dev Tools
- serverless-offline (local development)
- serverless-plugin-typescript
- jest or vitest (unit testing)
- ESLint + Prettier

---

## Database

### Engine
- PostgreSQL 15+ (AWS RDS or Aurora Serverless)

### ORM
- Sequelize 6 with sequelize-cli for migrations
- All models use TypeScript class-based definitions
- Paranoid mode enabled (soft deletes via deleted_at)

### Key Conventions
- Primary keys: UUID v4
- Monetary fields: INTEGER (stored in centavos, e.g., ₱1000 = 100000)
- Timestamps: TIMESTAMPTZ in UTC
- Indexes on: account_number, email, mobile_number, status, created_at

---

## Authentication & Security

### Auth Provider
- AWS Cognito User Pool (managed authentication)
- Frontend uses `amazon-cognito-identity-js` or `@aws-amplify/auth` for login flows
- Backend validates Cognito JWT tokens (ID token or Access token)

### Auth Flow
1. Admin logs in with email + password via Cognito Hosted UI or custom login form
2. Cognito authenticates and returns ID token, Access token, and Refresh token
3. Access token sent as Bearer token in Authorization header
4. Refresh token managed by Cognito SDK (automatic refresh)
5. Backend middleware validates JWT signature against Cognito JWKS endpoint
6. Custom claims or Cognito groups used for role-based access (Super Admin, Admin, Cashier)

### Cognito Configuration
- User Pool with email as primary sign-in attribute
- No self-registration (admin-only user creation via Cognito Admin API)
- Password policy: min 8 chars, requires uppercase, lowercase, number, special char
- MFA: optional TOTP (configurable per environment)
- Token expiration: Access token 15min, ID token 15min, Refresh token 7 days
- Cognito Groups for roles: `SuperAdmin`, `Admin`, `Cashier`
- Pre-token generation Lambda trigger to inject custom claims if needed

### Security Measures
- Passwords managed entirely by Cognito (no local hashing)
- JWT validation via Cognito JWKS (public keys cached)
- Rate limiting handled by Cognito (built-in throttling) + API Gateway throttling
- CORS restricted to frontend domain
- Input sanitization on all endpoints
- SQL injection prevention via parameterized queries (Sequelize)
- IP whitelist for admin panel (configurable)

### Role Permissions
| Action | Super Admin | Admin | Cashier |
|--------|:-----------:|:-----:|:-------:|
| Manage users | ✓ | ✗ | ✗ |
| Manage plans | ✓ | ✓ | ✗ |
| Manage customers | ✓ | ✓ | ✗ |
| Record payments | ✓ | ✓ | ✓ |
| View reports | ✓ | ✓ | ✗ |
| MikroTik controls | ✓ | ✓ | ✗ |
| Backup/restore | ✓ | ✗ | ✗ |
| View audit logs | ✓ | ✓ | ✗ |

---

## AWS Infrastructure

### Services Used
| Service | Purpose |
|---------|---------|
| Cognito | User authentication, token management, role groups |
| Lambda | API handlers (serverless functions) |
| API Gateway | HTTP routing, CORS, throttling, Cognito authorizer |
| RDS (PostgreSQL) | Primary database |
| S3 | Customer documents, PDF storage, frontend hosting |
| CloudFront | CDN for frontend |
| SES | Email notifications |
| SNS | SMS notifications (or third-party like Semaphore) |
| Secrets Manager | DB credentials, API keys, MikroTik credentials |
| CloudWatch | Logging, monitoring, alarms |
| EventBridge | Scheduled tasks (billing generation, overdue checks) |

### Serverless Config Highlights
- Runtime: nodejs20.x
- Memory: 256MB default (512MB for PDF generation)
- Timeout: 30s default
- VPC: Lambda in VPC for RDS access
- Layers: shared dependencies layer

---

## MikroTik Integration

### Connection
- Protocol: RouterOS API (port 8728) or API-SSL (port 8729)
- Library: routeros-client npm package
- Credentials stored in AWS Secrets Manager

### Operations
| Operation | RouterOS Command |
|-----------|-----------------|
| Disconnect | Disable PPPoE/Hotspot user or add firewall rule |
| Reconnect | Enable PPPoE/Hotspot user or remove firewall rule |
| Check status | Query active connections |
| Get sessions | List active PPPoE/Hotspot sessions |

### Automation
- EventBridge cron triggers daily overdue check
- Auto-disconnect: customers overdue > configured days
- Auto-reconnect: triggered immediately after payment confirmation
- All actions logged with timestamps in mikrotik_logs table

---

## Notification System

### Email
- Provider: AWS SES (or SMTP fallback)
- Templates: HTML email templates stored in S3 or inline
- Types: due reminder, overdue notice, payment receipt, disconnect warning, reconnect confirmation

### SMS
- Provider: Semaphore API (Philippine SMS gateway) or AWS SNS
- Format: plain text, max 160 characters
- Types: same as email

### Scheduling
- Due reminders: 3 days before due date
- Overdue notices: 1 day after due date, then every 3 days
- Disconnect warning: 1 day before auto-disconnect
- Configurable via admin settings

---

## Development Workflow

### Local Development
1. Frontend: `npm run dev` (Vite dev server, port 3000)
2. Backend: `serverless offline` (local Lambda emulation, port 4000)
3. Database: Local PostgreSQL or Docker container

### Environment Variables
```
# Backend (.env)
DATABASE_URL=postgresql://user:pass@localhost:5432/billing_db
COGNITO_USER_POOL_ID=ap-southeast-1_xxxxxxxxx
COGNITO_CLIENT_ID=your-cognito-app-client-id
COGNITO_REGION=ap-southeast-1
MIKROTIK_HOST=192.168.88.1
MIKROTIK_PORT=8728
MIKROTIK_USER=admin
MIKROTIK_PASSWORD=password
SMS_API_KEY=semaphore-api-key
AWS_REGION=ap-southeast-1
S3_BUCKET=billing-system-docs
FRONTEND_URL=http://localhost:3000

# Frontend (.env)
VITE_API_URL=http://localhost:4000/api/v1
VITE_APP_NAME=ISP Billing System
VITE_COGNITO_USER_POOL_ID=ap-southeast-1_xxxxxxxxx
VITE_COGNITO_CLIENT_ID=your-cognito-app-client-id
VITE_COGNITO_REGION=ap-southeast-1
```

### Deployment
- Backend: `serverless deploy --stage production`
- Frontend: Build and sync to S3, invalidate CloudFront
- Database: Run migrations via CI/CD pipeline
- Region: ap-southeast-1 (Singapore, closest to Philippines)

---

## Package Versions (Pinned)

### Frontend
```json
{
  "vue": "^3.4.0",
  "vuetify": "^3.5.0",
  "pinia": "^2.1.0",
  "vue-router": "^4.3.0",
  "axios": "^1.7.0",
  "amazon-cognito-identity-js": "^6.3.0",
  "date-fns": "^3.6.0",
  "zod": "^3.23.0",
  "chart.js": "^4.4.0",
  "vue-chartjs": "^5.3.0"
}
```

### Backend
```json
{
  "sequelize": "^6.37.0",
  "pg": "^8.12.0",
  "aws-jwt-verify": "^4.0.0",
  "zod": "^3.23.0",
  "uuid": "^9.0.0",
  "dayjs": "^1.11.0",
  "routeros-client": "^1.2.0",
  "middy": "^5.3.0",
  "@aws-sdk/client-s3": "^3.500.0",
  "@aws-sdk/client-ses": "^3.500.0",
  "@aws-sdk/client-cognito-identity-provider": "^3.500.0"
}
```

# Data Models per Domain

> The data model of each domain. Every domain has **its own PostgreSQL
> instance and database**, defined and migrated by its `synkro-<domain>-db`
> repository; no service connects to another domain's database (ADR-005).
>
> The field list comes from ADR-001 §7; ADR-005 changed the table names,
> the money types and the constraint conventions. This document gives the
> DDL each `-db` repository implements.

---

## Data modeling principles

### 1. Database per domain (mandatory)
A service reads and writes only its own database. Data from another domain
is requested through that domain's API, never with SQL.

```
✓ synkro-sales-api → sales-db (its own instance)
✓ sales portal     → GET /api/v1/customers/{id} → synkro-customers-api → customers-db
✗ synkro-sales-api → any connection to customers-db
```

### 2. Audit field: `active`, not `deleted_at`
Soft delete uses a boolean `active` field on every table whose rows can be
deactivated, not the generic `deleted_at` pattern. A row is considered
deleted when `active = false`. Records that are never edited (stock
adjustments, reservation lines, idempotency keys) have no `active` field,
and records with a lifecycle (reservations, alerts, sagas) use a `status`.
Timestamp fields keep their business names (`registration_date`, `date`).

### 3. Soft delete by default
Never delete a record with a physical `DELETE`. Set `active = false`
instead. This preserves traceability (NFR-009). The database enforces it:
the service's role has no `DELETE` permission (principle 6).

### 4. Conventions

| Element | Rule | Example |
|---|---|---|
| Schema | Named after the domain; nothing lives in `public` | `customers` |
| Tables | Singular `snake_case`, named after one row | `customer`, `sale_detail`, `system_user` (`user` is reserved) |
| Text | `text`, with a named `CHECK` on length when the business sets a limit | `chk_customer_name_length` |
| Closed sets | Named `CHECK`, never `ENUM` | `chk_system_user_role` |
| Money | `bigint` in minor units (1/100 COP), named `…_cents` | `price_cents` |
| Timestamps | `timestamptz` | `registration_date` |
| Constraints | Explicit names: `pk_<table>`, `fk_<table>_<target>`, `uq_<table>_<columns>`, `chk_<table>_<rule>` | `uq_customer_identity_document` |
| Foreign keys | Only inside the same domain; added after the tables, with `ON DELETE RESTRICT` and their own index | `fk_refresh_token_user` |
| External references | `<entity>_id` as a plain UUID, no foreign key, verified through the owning domain's API | `sale.customer_id` |
| Indexes | `idx_<table>_<columns>`; each one serves a known query | `idx_refresh_token_user_id` |

### 5. Migrations (Flyway)
Each `-db` repository organizes its migrations by family, with one version
sequence for the whole repository. The number, not the folder, decides the
order. Every `V<n>` has its rollback `U<n>` under `05_rollbacks/`, which
Flyway never runs on its own (ADR-005).

```
synkro-customers-db/
├── 01_ddl/01_schemas/V001__create_schema_customers.sql
├── 01_ddl/03_tables/V002__create_customer.sql
├── 01_ddl/03_tables/V003__create_idempotency_key.sql
├── 01_ddl/04_alter/V004__add_foreign_keys.sql
├── 01_ddl/10_indexes/V005__create_indexes.sql
├── 03_dcl/00_roles/V006__create_roles.sql
├── 03_dcl/01_grants/V007__grants.sql
├── 05_rollbacks/…/U001__create_schema_customers.sql … U007__grants.sql
├── deploy/compose.yml
├── deploy/init/create-app-user.sh
└── flyway.toml
```

### 6. Roles and credentials
- Migrations create only roles **without login or password**: `<domain>_reader` (`SELECT`) and `<domain>_writer` (`SELECT`, `INSERT`, `UPDATE`; no `DELETE`).
- Users with a password come from environment secrets, never from a repository:
  - **Owner** (`<DOMAIN>_DB_USER`): created by the PostgreSQL image; used only by the migration runner.
  - **Service user** (`<DOMAIN>_APP_USER`): created with login and no privileges by `deploy/init/create-app-user.sh` on the instance's first start.
- The last grant migration gives `<domain>_writer` to the service user through a Flyway placeholder that carries only its name (`FLYWAY_PLACEHOLDERS_APP_USER`).

### 7. Idempotency keys
Every domain that creates resources over HTTP has an `idempotency_key`
table. The service writes the resource and its key in **one transaction**;
if the key already exists, it rolls back and returns the original resource
(ADR-005). The key has 8 to 128 characters. When a domain creates one kind
of resource, the key has a foreign key to it; when it creates several, it
stores the resource type and identifier (`resource_type`, `resource_id`).

---

## Domain: `auth`

**Instance:** `auth-db` · **Database and schema:** `auth` · **Repository:** `synkro-auth-db`

**Engine justification:** ACID guarantees are required for user credentials and role assignment — a user must never exist without a role. See `01-context/overview.md`, "Alternatives Considered".

```sql
-- 01_ddl/03_tables/V002__create_system_user.sql
CREATE TABLE auth.system_user (
  user_id            uuid        NOT NULL DEFAULT gen_random_uuid(),
  name               text        NOT NULL,
  email              text        NOT NULL,
  password_hash      text        NOT NULL,
  role               text        NOT NULL,
  registration_date  timestamptz NOT NULL DEFAULT now(),
  active             boolean     NOT NULL DEFAULT true,
  CONSTRAINT pk_system_user PRIMARY KEY (user_id),
  CONSTRAINT uq_system_user_email UNIQUE (email),
  CONSTRAINT chk_system_user_name_length CHECK (char_length(name) BETWEEN 1 AND 150),
  CONSTRAINT chk_system_user_email_length CHECK (char_length(email) BETWEEN 3 AND 255),
  CONSTRAINT chk_system_user_role CHECK (role IN ('ADMIN', 'SALESPERSON', 'INVENTORY'))
);

-- 01_ddl/03_tables/V003__create_refresh_token.sql
CREATE TABLE auth.refresh_token (
  token_id         uuid        NOT NULL DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL,
  token            text        NOT NULL,   -- stores a hash, never the token itself
  expiration_date  timestamptz NOT NULL,
  active           boolean     NOT NULL DEFAULT true,
  CONSTRAINT pk_refresh_token PRIMARY KEY (token_id),
  CONSTRAINT uq_refresh_token_token UNIQUE (token)
);

-- 01_ddl/03_tables/V004__create_idempotency_key.sql
CREATE TABLE auth.idempotency_key (
  key         text        NOT NULL,
  user_id     uuid        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_idempotency_key PRIMARY KEY (key),
  CONSTRAINT chk_idempotency_key_length CHECK (char_length(key) BETWEEN 8 AND 128)
);

-- 01_ddl/04_alter/V005__add_foreign_keys.sql
ALTER TABLE auth.refresh_token ADD CONSTRAINT fk_refresh_token_user
  FOREIGN KEY (user_id) REFERENCES auth.system_user (user_id) ON DELETE RESTRICT;
ALTER TABLE auth.idempotency_key ADD CONSTRAINT fk_idempotency_key_user
  FOREIGN KEY (user_id) REFERENCES auth.system_user (user_id) ON DELETE RESTRICT;

-- 01_ddl/10_indexes/V006__create_indexes.sql
CREATE INDEX idx_refresh_token_user_id ON auth.refresh_token (user_id);
CREATE INDEX idx_idempotency_key_user_id ON auth.idempotency_key (user_id);

-- 03_dcl/00_roles/V007__create_roles.sql
CREATE ROLE auth_reader NOLOGIN;
CREATE ROLE auth_writer NOLOGIN;

-- 03_dcl/01_grants/V008__grants.sql
GRANT USAGE ON SCHEMA auth TO auth_reader, auth_writer;
GRANT SELECT ON ALL TABLES IN SCHEMA auth TO auth_reader;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA auth TO auth_writer;
GRANT auth_writer TO "${app_user}";
```

- `system_user.role` never takes `SERVICE`: that role exists only inside service tokens (ADR-006).
- `idempotency_key` protects user registration. How service-token issuance is retried safely is defined with the auth contract.

```mermaid
erDiagram
    SYSTEM_USER ||--o{ REFRESH_TOKEN : issues
    SYSTEM_USER ||--o{ IDEMPOTENCY_KEY : "created with"
    SYSTEM_USER {
        uuid user_id PK
        text email
        text role
        boolean active
    }
    REFRESH_TOKEN {
        uuid token_id PK
        uuid user_id FK
        timestamptz expiration_date
        boolean active
    }
    IDEMPOTENCY_KEY {
        text key PK
        uuid user_id FK
    }
```

---

## Domain: `customers`

**Instance:** `customers-db` · **Database and schema:** `customers` · **Repository:** `synkro-customers-db`

```sql
-- 01_ddl/03_tables/V002__create_customer.sql
CREATE TABLE customers.customer (
  customer_id        uuid        NOT NULL DEFAULT gen_random_uuid(),
  name               text        NOT NULL,
  identity_document  text        NOT NULL,
  email              text,
  phone              text,
  address            text,
  registration_date  timestamptz NOT NULL DEFAULT now(),
  active             boolean     NOT NULL DEFAULT true,
  CONSTRAINT pk_customer PRIMARY KEY (customer_id),
  CONSTRAINT uq_customer_identity_document UNIQUE (identity_document),
  CONSTRAINT chk_customer_name_length CHECK (char_length(name) BETWEEN 1 AND 150),
  CONSTRAINT chk_customer_identity_document_length CHECK (char_length(identity_document) BETWEEN 1 AND 30),
  CONSTRAINT chk_customer_email_length CHECK (email IS NULL OR char_length(email) <= 255),
  CONSTRAINT chk_customer_phone_length CHECK (phone IS NULL OR char_length(phone) <= 20),
  CONSTRAINT chk_customer_address_length CHECK (address IS NULL OR char_length(address) <= 255)
);

-- 01_ddl/03_tables/V003__create_idempotency_key.sql
CREATE TABLE customers.idempotency_key (
  key          text        NOT NULL,
  customer_id  uuid        NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_idempotency_key PRIMARY KEY (key),
  CONSTRAINT chk_idempotency_key_length CHECK (char_length(key) BETWEEN 8 AND 128)
);

-- 01_ddl/04_alter/V004__add_foreign_keys.sql
ALTER TABLE customers.idempotency_key ADD CONSTRAINT fk_idempotency_key_customer
  FOREIGN KEY (customer_id) REFERENCES customers.customer (customer_id) ON DELETE RESTRICT;

-- 01_ddl/10_indexes/V005__create_indexes.sql
CREATE INDEX idx_idempotency_key_customer_id ON customers.idempotency_key (customer_id);

-- 03_dcl: V006 creates customers_reader and customers_writer; V007 grants them
-- exactly as in auth, and gives customers_writer to "${app_user}".
```

- `uq_customer_identity_document` also serves the point-of-sale lookup by identity document (ADR-004 Decision 1). The document is unique across all customers, active or not.
- `email`, `phone` and `address` are nullable: not every walk-in customer provides them.

```mermaid
erDiagram
    CUSTOMER ||--o{ IDEMPOTENCY_KEY : "created with"
    CUSTOMER {
        uuid customer_id PK
        text name
        text identity_document
        boolean active
    }
    IDEMPOTENCY_KEY {
        text key PK
        uuid customer_id FK
    }
```

---

## Domain: `products`

**Instance:** `products-db` · **Database and schema:** `products` · **Repository:** `synkro-products-db`

```sql
-- 01_ddl/03_tables/V002__create_category.sql
CREATE TABLE products.category (
  category_id  uuid    NOT NULL DEFAULT gen_random_uuid(),
  name         text    NOT NULL,
  active       boolean NOT NULL DEFAULT true,
  CONSTRAINT pk_category PRIMARY KEY (category_id),
  CONSTRAINT chk_category_name_length CHECK (char_length(name) BETWEEN 1 AND 100)
);
-- 01_ddl/03_tables/V003__create_product.sql
CREATE TABLE products.product (
  product_id   uuid    NOT NULL DEFAULT gen_random_uuid(),
  name         text    NOT NULL,
  price_cents  bigint  NOT NULL,
  stock        integer NOT NULL DEFAULT 0,
  category_id  uuid    NOT NULL,
  active       boolean NOT NULL DEFAULT true,
  CONSTRAINT pk_product PRIMARY KEY (product_id),
  CONSTRAINT chk_product_name_length CHECK (char_length(name) BETWEEN 1 AND 150),
  CONSTRAINT chk_product_price_cents CHECK (price_cents > 0),
  CONSTRAINT chk_product_stock CHECK (stock >= 0)
);
-- 01_ddl/03_tables/V004__create_stock_adjustment.sql
CREATE TABLE products.stock_adjustment (
  adjustment_id  uuid        NOT NULL DEFAULT gen_random_uuid(),
  product_id     uuid        NOT NULL,
  delta          integer     NOT NULL,
  reason         text        NOT NULL,
  adjusted_by    uuid        NOT NULL,   -- external reference: sub of the validated token
  adjusted_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_stock_adjustment PRIMARY KEY (adjustment_id),
  CONSTRAINT chk_stock_adjustment_delta CHECK (delta <> 0),
  CONSTRAINT chk_stock_adjustment_reason_length CHECK (char_length(reason) BETWEEN 1 AND 255)
);
-- 01_ddl/03_tables/V005__create_stock_reservation.sql
CREATE TABLE products.stock_reservation (
  reservation_id  uuid        NOT NULL DEFAULT gen_random_uuid(),
  status          text        NOT NULL DEFAULT 'RESERVED',
  created_at      timestamptz NOT NULL DEFAULT now(),
  released_at     timestamptz,
  CONSTRAINT pk_stock_reservation PRIMARY KEY (reservation_id),
  CONSTRAINT chk_stock_reservation_status CHECK (status IN ('RESERVED', 'RELEASED')),
  CONSTRAINT chk_stock_reservation_released_at CHECK ((status = 'RELEASED') = (released_at IS NOT NULL))
);
-- 01_ddl/03_tables/V006__create_stock_reservation_line.sql
CREATE TABLE products.stock_reservation_line (
  line_id           uuid    NOT NULL DEFAULT gen_random_uuid(),
  reservation_id    uuid    NOT NULL,
  product_id        uuid    NOT NULL,
  quantity          integer NOT NULL,
  unit_price_cents  bigint  NOT NULL,   -- price frozen when the stock is reserved
  CONSTRAINT pk_stock_reservation_line PRIMARY KEY (line_id),
  CONSTRAINT uq_stock_reservation_line_product UNIQUE (reservation_id, product_id),
  CONSTRAINT chk_stock_reservation_line_quantity CHECK (quantity > 0),
  CONSTRAINT chk_stock_reservation_line_unit_price_cents CHECK (unit_price_cents > 0)
);
-- 01_ddl/03_tables/V007__create_stock_alert.sql
CREATE TABLE products.stock_alert (
  alert_id          uuid        NOT NULL DEFAULT gen_random_uuid(),
  product_id        uuid        NOT NULL,
  status            text        NOT NULL DEFAULT 'OPEN',
  stock_at_opening  integer     NOT NULL,
  opened_at         timestamptz NOT NULL DEFAULT now(),
  resolved_at       timestamptz,
  CONSTRAINT pk_stock_alert PRIMARY KEY (alert_id),
  CONSTRAINT chk_stock_alert_status CHECK (status IN ('OPEN', 'RESOLVED')),
  CONSTRAINT chk_stock_alert_stock_at_opening CHECK (stock_at_opening >= 0),
  CONSTRAINT chk_stock_alert_resolved_at CHECK ((status = 'RESOLVED') = (resolved_at IS NOT NULL))
);
-- 01_ddl/03_tables/V008__create_idempotency_key.sql
CREATE TABLE products.idempotency_key (
  key            text        NOT NULL,
  resource_type  text        NOT NULL,
  resource_id    uuid        NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_idempotency_key PRIMARY KEY (key),
  CONSTRAINT chk_idempotency_key_length CHECK (char_length(key) BETWEEN 8 AND 128),
  CONSTRAINT chk_idempotency_key_resource_type CHECK (resource_type IN
    ('PRODUCT', 'CATEGORY', 'STOCK_ADJUSTMENT', 'STOCK_RESERVATION', 'STOCK_ALERT'))
);
-- 01_ddl/04_alter/V009__add_foreign_keys.sql, all ON DELETE RESTRICT: fk_product_category, fk_stock_adjustment_product,
--   fk_stock_reservation_line_reservation, fk_stock_reservation_line_product, fk_stock_alert_product
-- 01_ddl/10_indexes/V010__create_indexes.sql
CREATE UNIQUE INDEX uq_category_name_active ON products.category (name) WHERE active;
CREATE UNIQUE INDEX uq_stock_alert_open_product ON products.stock_alert (product_id) WHERE status = 'OPEN';
CREATE INDEX idx_product_category_id ON products.product (category_id);
CREATE INDEX idx_product_name ON products.product (name);
CREATE INDEX idx_product_stock ON products.product (stock) WHERE active;   -- the worker's low-stock query
CREATE INDEX idx_stock_adjustment_product_id ON products.stock_adjustment (product_id);
CREATE INDEX idx_stock_reservation_line_product_id ON products.stock_reservation_line (product_id);
CREATE INDEX idx_stock_alert_product_id ON products.stock_alert (product_id);
-- 03_dcl: V011 creates products_reader/products_writer; V012 grants them as in auth, and products_writer to "${app_user}".
```

- **Stock changes only through a reservation or an adjustment.** Creating a reservation decreases `product.stock` for every line in **one transaction**, and `chk_product_stock` makes it fail as a whole if any line would go below zero. Releasing restores the stock once, only if the reservation was `RESERVED`.
- Category names are unique among active categories only; a product has at most one `OPEN` alert. Releasing a reservation and resolving an alert are idempotent by their status, so they need no idempotency key.

```mermaid
erDiagram
    CATEGORY ||--o{ PRODUCT : groups
    PRODUCT ||--o{ STOCK_ADJUSTMENT : "corrected by"
    PRODUCT ||--o{ STOCK_RESERVATION_LINE : "reserved in"
    STOCK_RESERVATION ||--|{ STOCK_RESERVATION_LINE : contains
    PRODUCT ||--o{ STOCK_ALERT : "alerted by"
```

---

## Domain: `sales`

**Instance:** `sales-db` · **Database and schema:** `sales` · **Repository:** `synkro-sales-db`

```sql
-- 01_ddl/03_tables/V002__create_sale.sql
CREATE TABLE sales.sale (
  sale_id      uuid        NOT NULL DEFAULT gen_random_uuid(),
  customer_id  uuid        NOT NULL,   -- external reference to customers
  created_by   uuid        NOT NULL,   -- external reference to auth (ADR-002, ADR-006)
  date         timestamptz NOT NULL DEFAULT now(),
  total_cents  bigint      NOT NULL,
  active       boolean     NOT NULL DEFAULT true,
  CONSTRAINT pk_sale PRIMARY KEY (sale_id),
  CONSTRAINT chk_sale_total_cents CHECK (total_cents >= 0)
);
-- 01_ddl/03_tables/V003__create_sale_detail.sql
CREATE TABLE sales.sale_detail (
  detail_id         uuid    NOT NULL DEFAULT gen_random_uuid(),
  sale_id           uuid    NOT NULL,
  product_id        uuid    NOT NULL,   -- external reference to products
  quantity          integer NOT NULL,
  unit_price_cents  bigint  NOT NULL,
  subtotal_cents    bigint  NOT NULL,
  active            boolean NOT NULL DEFAULT true,
  CONSTRAINT pk_sale_detail PRIMARY KEY (detail_id),
  CONSTRAINT chk_sale_detail_quantity CHECK (quantity > 0),
  CONSTRAINT chk_sale_detail_unit_price_cents CHECK (unit_price_cents > 0),
  CONSTRAINT chk_sale_detail_subtotal_cents CHECK (subtotal_cents = quantity * unit_price_cents)
);
-- 01_ddl/03_tables/V004__create_idempotency_key.sql
CREATE TABLE sales.idempotency_key (
  key         text        NOT NULL,
  sale_id     uuid        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_idempotency_key PRIMARY KEY (key),
  CONSTRAINT chk_idempotency_key_length CHECK (char_length(key) BETWEEN 8 AND 128)
);
-- 01_ddl/04_alter/V005__add_foreign_keys.sql, ON DELETE RESTRICT: fk_sale_detail_sale, fk_idempotency_key_sale
-- 01_ddl/10_indexes/V006__create_indexes.sql
CREATE INDEX idx_sale_detail_sale_id ON sales.sale_detail (sale_id);
CREATE INDEX idx_sale_detail_product_id ON sales.sale_detail (product_id);   -- top-products report
CREATE INDEX idx_idempotency_key_sale_id ON sales.idempotency_key (sale_id);
CREATE INDEX idx_sale_date ON sales.sale (date DESC);                         -- lists and reports, newest first
CREATE INDEX idx_sale_created_by_date ON sales.sale (created_by, date DESC); -- a salesperson's own sales
CREATE INDEX idx_sale_customer_id ON sales.sale (customer_id);
-- 03_dcl: V007 creates sales_reader/sales_writer; V008 grants them as in auth, and sales_writer to "${app_user}".
```

- `customer_id` and `product_id` point to other domains: the saga checks the customer and reserves the products before this row is written (ADR-007). `created_by` is sent by the saga and accepted only from a caller holding `sales:register` (ADR-006).
- `unit_price_cents` is the price frozen by the reservation. `total_cents` equals the sum of `subtotal_cents`, enforced by the domain because a `CHECK` cannot span rows. There is no `outbox` (ADR-007) and no `sales_summary` (ADR-005): reports aggregate `sale` and `sale_detail` (ADR-002).

---

## Saga store: `workflow`

**Instance:** `workflow-db` · **Database and schema:** `workflow` · **Repository:** `synkro-workflow`, under `db/` with the same layout. It holds the orchestrator's internal state, not a domain schema; only `synkro-workflow` connects to it (ADR-007).

```sql
-- db/01_ddl/03_tables/V002__create_saga_instance.sql
CREATE TABLE workflow.saga_instance (
  saga_id          uuid        NOT NULL DEFAULT gen_random_uuid(),
  saga_type        text        NOT NULL,
  idempotency_key  text        NOT NULL,
  status           text        NOT NULL DEFAULT 'RUNNING',
  initiated_by     uuid        NOT NULL,   -- sub of the person's validated token (ADR-006)
  input            jsonb       NOT NULL,   -- customer and lines, as requested
  step_results     jsonb       NOT NULL DEFAULT '{}'::jsonb,   -- reservation id, prices, sale id
  completed_steps  text[]      NOT NULL DEFAULT '{}',
  failed_step      text,
  error_detail     text,                   -- internal only, never returned to a client
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_saga_instance PRIMARY KEY (saga_id),
  CONSTRAINT uq_saga_instance_idempotency_key UNIQUE (saga_type, idempotency_key),
  CONSTRAINT chk_saga_instance_type CHECK (saga_type IN ('register-sale')),
  CONSTRAINT chk_saga_instance_status CHECK (status IN ('RUNNING', 'COMPLETED', 'COMPENSATED', 'FAILED')),
  CONSTRAINT chk_saga_instance_idempotency_key_length CHECK (char_length(idempotency_key) BETWEEN 8 AND 128)
);
-- db/01_ddl/10_indexes/V003__create_indexes.sql
CREATE INDEX idx_saga_instance_running ON workflow.saga_instance (created_at) WHERE status = 'RUNNING';  -- resumed at startup
```

- The row is updated **after every step and before the next one**; `step_results` keeps what later steps and compensations need. A `RUNNING` saga with `failed_step` set is compensating.
- The saga's own `idempotency_key` replaces a separate key table: a known key returns the same saga without running any step.

---

## Correlations

- Domain entities and invariants these tables implement → `02-domain/entities-and-rules.md`
- Original field list (immutable) → `ADR-001`, section 7
- `created_by` → `ADR-002`; its source through the saga → ADR-006
- Database per domain, conventions, minor units and idempotency keys → ADR-005
- Saga store, stock reservations and stock alerts → ADR-007
- Roles used in `system_user.role` → `00-governance/security-policy.md`
- Deployment of each instance and its migration runner → `05-architecture/deployment.md`

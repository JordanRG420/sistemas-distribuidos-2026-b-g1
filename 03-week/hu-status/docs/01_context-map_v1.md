# Context Map

## Sales Management System — SynkroTech SAS

**Version:** 1.0  
**Date:** August 2026

---

## Purpose

Before deciding on the architectural style (see `adr/adr-001-architecture.md`), this document identifies the **bounded contexts** of SynkroTech SAS's business domain using business language rather than database tables, and evaluates whether each context should become an independent service or remain together with another context.

---

## 1. Identified Bounded Contexts

### 1.1 Authentication and Users

**What it is:** Management of internal system user identities (SynkroTech SAS employees: administrators, sales representatives, and inventory staff), their credentials, and their roles/permissions.

**Why it is a separate context:** The concept of a "user who logs in" has no business relationship with a "customer who makes a purchase." These are two distinct entities with different life cycles: a user is created when an employee is hired, while a customer is created when someone makes their first purchase.

**Independent service?** **Yes.**  
**Justification:** It is a cross-cutting context. All other contexts depend on it to authorize operations, but it does not depend on any of them. Isolating it prevents security logic from being duplicated or coupled to the Customer domain.

---

### 1.2 Customers

**What it is:** Information about SynkroTech SAS customers, including contact details and the fact that they exist as entities that can be associated with sales transactions.

**Why it is a separate context:** Its life cycle and business rules (validating identity documents, preventing duplicates, deactivating instead of deleting) are specific to the customer domain and do not depend on how products or sales are managed.

**Independent service?** **Yes.**  
**Justification:** It has low coupling with Products because they do not share business rules. Its only interaction with Sales is a simple query ("does this customer exist?"), which can be easily handled through an API without sharing a data model.

---

### 1.3 Products and Inventory

**What it is:** Product catalog, categories, and available stock management.

**Why it is a separate context:** It has its own business rules and is more likely to change frequently (new categories, stock adjustments, new products) than other contexts. It is also queried very frequently since every sale requires stock verification.

**Independent service?** **Yes.**  
**Justification:** This is the context with the highest need for frequent queries and concurrency control (preventing the sale of out-of-stock products). Isolating it allows optimization or independent scaling as the catalog grows without affecting Customers or Sales.

---

### 1.4 Sales (Including Reporting)

**What it is:** Recording commercial transactions (sales and sales details), orchestrating interactions with Customers and Products during the sales process, and generating reports (daily, monthly, top-selling products) from the same transactional data.

**Is Reporting its own context or part of Sales?**

Reporting was evaluated as a separate context, but it was decided that **Reporting belongs to the same business context as Sales**, rather than being a separate context, for the following reasons:

- Reports are generated **exclusively** from data already produced by the Sales context. They do not directly consume information from Customers or Products, only from transactions already owned by Sales.
- There are no Reporting business rules that are independent of Sales business rules. Reporting is essentially an aggregated view of the same transactional information.
- There is no need to scale Reporting differently from Sales, since both grow at the same rate. Every new sale simultaneously becomes new reporting data.

**Independent service?** **Yes** (Sales, including Reporting, as a single service).  
**Justification:** Sales is the context that depends most heavily on the other two business contexts (Customers and Products). Isolating it allows Sales to be the sole orchestration point between them, without requiring Customers or Products to be aware of sales transactions.

---

## 2. Context Map Summary

| Context | Independent Service? | Depends On | Depended On By |
|----------|----------|----------|----------|
| Authentication and Users | Yes | — | Customers, Products, Sales (JWT validation) |
| Customers | Yes | Authentication (JWT validation) | Sales (customer existence lookup) |
| Products and Inventory | Yes | Authentication (JWT validation) | Sales (stock and price lookup) |
| Sales (+ Reporting) | Yes | Authentication, Customers, Products | — |

**Total: 4 contexts → 4 microservices.** No context was grouped with another except Reporting, which was integrated as an internal Sales module because it belongs to the same business domain context. This was not a simplification driven by repository constraints, but rather a genuine domain-driven design decision.

---

## 3. Criteria Used to Decide "Independent Service vs. Combined"

Each context was evaluated according to the following criteria:

1. **Independent Change:** Does this context evolve at a different frequency and for different reasons than the others?
2. **Business Coupling:** Does it share business rules with other contexts, or does it only exchange specific data through queries?
3. **Scaling Requirements:** Could this context require different levels of resources or availability compared to the others?
4. **Data Ownership:** Who is the natural owner of this information? Can a single responsible context be clearly identified?

The four identified contexts satisfy these criteria independently, which supports the decision to separate them as services (formalized in `adr/adr-001-architecture.md`). Reporting, however, does not satisfy any of these criteria differently from Sales, and therefore remains part of that context.
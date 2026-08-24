# PDR — Preliminary Design Review Document

## Sales Management System — SynkroTech SAS

**Version:** 1.0

**Date:** August 2026

**Course:** Distributed Systems

**Document Type:** Preliminary — for review and approval

---

## Team Members

| Full Name | GitHub User |
|------------|------------|
| Sergio Andres Ordoñez Diaz | https://github.com/SergioAndres17 |
| Fredman Santiago Plazas Artunduaga | https://github.com/SantiagoPlazas2005 |
| Jordan Ramirez Gallego | https://github.com/JordanRG420 |
| Angel Gustavo Solano Trujillo | https://github.com/AsolanoT |

---

## 00 — Initial Context

**SynkroTech SAS** is a medium-sized company dedicated to the commercialization of technology products and electronic accessories, including desktop computers, laptops, peripherals, hardware components, storage devices, and networking equipment.

Due to growing sales and an increasing number of products in its catalog, the company requires a solution that enables centralized management of customer information, products, inventory, and sales transactions.

Currently, sales and inventory control are managed through scattered tools and manual processes (spreadsheets, paper records, and isolated systems), making it difficult to accurately track product availability, customer purchase history, and sales performance.

---

## 01 — Needs and Problems

### 1.1 Core Need

To have a system that centralizes customers, products, and sales; automates calculations and inventory control; maintains transaction traceability; and provides useful reports for SynkroTech SAS's commercial and administrative management, all under a secure access model.

### 1.2 Identified Problems

- Difficulty determining real-time product availability in inventory.
- Lack of traceability of customer purchase history.
- Error-prone manual calculations during sales registration.
- Absence of consolidated reports to support business decisions (sales by day, by month, best-selling products).
- Information scattered across non-integrated tools, with no single source of truth.

### 1.3 Functional Requirements

| ID | Requirement |
|---|---|
| FR-01 | The system must allow registering, updating, querying, and deactivating customers. |
| FR-02 | The system must allow registering, updating, querying, and deactivating products. |
| FR-03 | The system must allow organizing products into categories. |
| FR-04 | The system must control the available stock of each product. |
| FR-05 | The system must allow registering a sale by associating a customer with one or more products. |
| FR-06 | The system must automatically calculate the total amount of a sale based on the product details. |
| FR-07 | The system must automatically deduct stock when a sale is registered. |
| FR-08 | The system must generate daily and monthly sales reports. |
| FR-09 | The system must generate a best-selling products report. |
| FR-10 | The system must authenticate users and restrict operations according to their role (ADMIN, SALES, INVENTORY). |

### 1.4 Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-01 | The system must be available through a web interface accessible via a browser. |
| NFR-02 | Operations involving business data must require JWT-based authentication. |
| NFR-03 | The system must allow each business component (customers, products, sales, authentication) to evolve independently. |
| NFR-04 | The system must maintain operational traceability (records are not physically deleted, only deactivated). |
| NFR-05 | The system must respond to critical operations (registering a sale, checking stock) within reasonable timeframes for daily business use. |
| NFR-06 | The system must be prepared to grow in catalog size and transaction volume without major redesign. |
| NFR-07 | The system must support interoperability between its components through standard interfaces (REST APIs). |

---

## 02 — Current Processes / Expected Workflow

### Current Process (Manual)

1. A salesperson assists a customer and manually checks product availability (through physical inspection or an outdated spreadsheet).
2. The sale is recorded in a notebook or isolated file, with no connection to the inventory system.
3. Stock is not updated automatically and is manually adjusted, sometimes days later.
4. There is no consolidated reporting; to determine sales performance over a period, someone must manually review and add information from multiple sources.

### Expected Workflow (With the System)

1. A system user (salesperson, inventory staff member, or administrator) logs in and the system validates their role.
2. The salesperson searches for the customer (or registers them if they are new) and selects the products to be sold.
3. The system validates stock availability in real time before confirming the sale.
4. Upon confirmation, the system calculates the total amount, automatically deducts stock, and records the transaction with full traceability.
5. At any time, an authorized user can consult daily, monthly, or best-selling product reports generated from real and up-to-date data.

```mermaid
flowchart TD
    A[User logs in] --> B{Valid role?}
    B -- No --> Z[Access denied]
    B -- Yes --> C[Salesperson searches for customer]
    C --> D{Customer exists?}
    D -- No --> E[Register new customer]
    D -- Yes --> F[Select products to sell]
    E --> F
    F --> G{Stock available?}
    G -- No --> H[Reject product / adjust quantity]
    H --> F
    G -- Yes --> I[Confirm sale]
    I --> J[Calculate total]
    J --> K[Automatically deduct stock]
    K --> L[Record transaction with traceability]
    L --> M[(Data available for reporting)]
    M --> N[Authorized user consults reports:<br/>daily / monthly / top products]
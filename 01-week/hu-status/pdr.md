# Preliminary Design Review (PDR)

## Sales Management System for a Store

**Author:** Jordan Ramírez Gallego  
**Version:** 1.0  
**Date:** August 11 2026

---

# 1. Document Purpose

This document aims to define and justify the preliminary design of the Sales Management System for a small or medium-sized retail store. Its purpose is to establish a clear vision of the proposed technological solution before starting the detailed design and implementation phases.

The document helps identify the business problem to be solved, the users' needs, the functional scope of the system, and the boundaries of the first project release.

Additionally, this document serves as a reference point for all development team members by providing a shared understanding of the system's objectives and the functionalities that must be implemented throughout the project.

The main objectives of this document are:

- Clearly define the business problem.
- Identify the needs that motivate the development of the system.
- Establish the scope of the proposed solution.
- Provide a foundation for design and implementation decisions.
- Reduce misunderstandings among team members and project stakeholders.
- Serve as a preliminary review document before the development of the microservices and web application.

---

# 2. Background and Need

## Current Context

Many small and medium-sized retail stores manage information related to customers, products, and inventory using manual methods or loosely connected tools such as spreadsheets, paper records, or isolated applications.

Although these solutions may work in the early stages of a business, managing information becomes increasingly difficult as the number of products, customers, and transactions grows.

The lack of a centralized platform creates operational challenges and increases the likelihood of administrative errors.

---

## Identified Problems

The following issues have been identified in the daily management of a retail store:

### Inefficient Inventory Management

Manual stock control may lead to discrepancies between the actual quantity of available products and the recorded inventory, resulting in financial losses or customer service issues.

### Dispersed Information

Customer, product, and sales data are often stored in different locations, making it difficult to access accurate and updated information quickly.

### Sales Calculation Errors

When sales values are calculated manually, there is a higher risk of mistakes in quantities, subtotals, and final totals.

### Lack of Traceability

In many cases, there is no reliable record showing who performed a sale, when it occurred, or which products were included in the transaction.

### Limited Analytical Capabilities

The absence of automated reporting makes it difficult to answer important business questions such as:

- How much was sold during the day?
- Which month generated the highest sales volume?
- What are the best-selling products?
- Which customers make purchases most frequently?

### Insufficient Security

Many small businesses lack formal authentication and access control mechanisms, allowing unauthorized users to access or modify sensitive information.

---

## Business Need

There is a need to implement a technological solution that centralizes the store's commercial operations within a single platform.

The system must allow the management of customers, products, and inventory, enable secure sales registration, and provide useful information to support business decision-making.

The proposed solution seeks to reduce operational errors, improve data accuracy, and simplify the administrative activities of the business.

---

## Solution Objectives

The implementation of the Sales Management System aims to:

- Centralize all commercial information in a single platform.
- Maintain accurate and updated inventory records.
- Automate calculations related to the sales process.
- Preserve a reliable transaction history.
- Facilitate information access through reporting features.
- Improve security through JWT-based authentication.
- Provide a scalable platform based on a microservices architecture.

---

# 3. Project Scope

## General Scope

The project involves the development of a web application focused on the management of customers, products, inventory, and sales for a retail store.

The solution will be implemented using a microservices architecture with REST API communication and a web interface developed in React.

---

## Included Functionalities

### Customer Management

The system will allow users to:

- Register new customers.
- View customer information.
- Update customer records.
- Delete customer records.
- Search customers using different criteria.

---

##

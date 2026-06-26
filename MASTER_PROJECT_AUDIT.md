# MASTER_PROJECT_AUDIT.md

# Shree Shyam Dairy Farm – Enterprise Master Audit & Planning Document

## ROLE

You are a Principal Software Architect, Technical Lead, Product Architect, DevOps Architect, Security Architect, Database Architect and AI Solution Architect with 20+ years of experience.

You are working on an EXISTING enterprise-grade Next.js application.

You are NOT allowed to create a new project.

Your first responsibility is to understand the existing project before writing or modifying any code.

Never assume.

Always inspect the project.

---

# OBJECTIVE

Your responsibility is to perform a complete project audit and generate a detailed implementation roadmap.

You must determine:

- What is already implemented
- What is partially implemented
- What is missing
- What is incorrect
- What should be improved
- What should be removed
- What should be implemented next

Never overwrite existing work without checking it first.

---

# PHASE 1 — PROJECT ANALYSIS

Inspect the complete workspace.

Review:

- package.json
- tsconfig.json
- next.config.ts/js
- eslint
- prettier
- tailwind
- prisma
- app folder
- src folder
- components
- hooks
- services
- repositories
- middleware
- utilities
- lib
- store
- public
- API routes
- authentication
- database
- environment variables
- build scripts

---

# PHASE 2 — FEATURE AUDIT

Audit every module.

## Foundation

- Folder Structure
- Environment
- Config
- Logging
- Error Handling
- Documentation
- CI/CD

## Authentication

- Login
- Signup
- Forgot Password
- Reset Password
- OTP
- Google Login
- Apple Login
- JWT
- Sessions
- RBAC

## Customer

- Home
- Products
- Categories
- Search
- Filters
- Wishlist
- Cart
- Buy Again
- Recently Viewed
- Save For Later
- Compare

## Checkout

- Address
- Coupons
- GST
- Delivery Slot
- Order Summary

## Payments

- Razorpay
- Payment Verification
- Webhooks
- Retry
- Invoice

## Orders

- Order Tracking
- Timeline
- Cancel
- Refund
- Return

## Subscription

- Daily Milk
- Pause
- Resume
- Vacation
- Calendar

## Admin

- Dashboard
- Products
- Orders
- Customers
- Coupons
- CMS
- Reports

## Inventory

- Warehouse
- Batch
- Stock
- Purchase
- Supplier

## Delivery

- Delivery Boy
- Routes
- OTP
- GPS

## Dairy ERP

- Cow Management
- Milk Collection
- Feed
- Health
- Breeding
- Calf
- Finance
- Reports

## AI

- Chat Assistant
- Prediction
- Recommendation

## IoT

- Devices
- MQTT
- Sensors
- Alerts

---

# PHASE 3 — DATABASE AUDIT

Review Prisma.

Check

- Missing indexes
- Missing relations
- Duplicate tables
- Naming conventions
- Migrations
- Performance

---

# PHASE 4 — FRONTEND AUDIT

Check

- Component duplication
- Reusable components
- Responsive design
- Accessibility
- SEO
- Performance
- Loading states
- Skeletons
- Error states

---

# PHASE 5 — BACKEND AUDIT

Review

- API routes
- Validation
- Authentication
- Authorization
- Services
- Repository Pattern
- Error Handling
- Logging

---

# PHASE 6 — SECURITY AUDIT

Check

- Environment secrets
- Authentication
- Authorization
- XSS
- CSRF
- SQL Injection
- Rate Limiting
- Security Headers
- Password Storage

---

# PHASE 7 — PERFORMANCE AUDIT

Check

- Bundle Size
- Images
- React Rendering
- Lazy Loading
- Dynamic Imports
- Prisma Queries
- Database Indexes
- API Performance

---

# PHASE 8 — CODE QUALITY

Check

- ESLint
- Prettier
- TypeScript
- Dead Code
- Duplicate Code
- Circular Dependencies
- Naming Conventions

---

# PHASE 9 — DOCUMENTATION

Verify documentation.

If missing, recommend.

Architecture

Database

API

Deployment

Developer Guide

Setup Guide

Coding Standards

---

# PHASE 10 — FINAL REPORT

Generate:

## Executive Summary

## Overall Completion Percentage

Foundation

Authentication

Customer

Checkout

Payments

Orders

Subscription

Admin

Inventory

Delivery

ERP

AI

IoT

Security

Performance

Documentation

## Current Status

Completed

Partially Completed

Pending

Blocked

## Critical Issues

List all critical issues.

## High Priority Tasks

List the top 20 tasks.

## Medium Priority Tasks

List the next 20 tasks.

## Low Priority Tasks

List future improvements.

## Technical Debt

List all technical debt.

## Risk Analysis

Identify project risks.

## Architecture Score

Score out of 10.

## Security Score

Score out of 10.

## Performance Score

Score out of 10.

## Code Quality Score

Score out of 10.

## Scalability Score

Score out of 10.

## Production Readiness

Score out of 100.

## Recommended Next Sprint

Recommend ONLY ONE next sprint.

Do NOT recommend multiple sprints.

---

# IMPORTANT RULES

- Never rewrite working code.
- Never remove features without justification.
- Prefer refactoring over rewriting.
- Reuse existing components.
- Follow existing architecture.
- Keep backward compatibility.
- Explain every recommendation.
- Produce actionable output only.

At the end, create:

1. PROJECT_STATUS.md
2. NEXT_SPRINT_PLAN.md
3. TECHNICAL_DEBT.md
4. IMPLEMENTATION_CHECKLIST.md

Stop after generating the audit and planning documents.

Do NOT implement any feature unless explicitly requested afterwards.

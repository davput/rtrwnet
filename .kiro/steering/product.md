# Product Overview

RT/RW Net SaaS is a multi-tenant ISP (Internet Service Provider) management platform designed for Indonesian neighborhood network operators (RT/RW Net). The platform enables operators to manage customers, service plans, billing, network devices, and monitoring from a centralized SaaS solution.

## Core Features

- **Multi-tenant architecture** - Each ISP operator gets isolated tenant with their own data
- **Customer management** - Track subscribers, devices, and service status
- **Subscription & billing** - Manage service plans, payments via Midtrans, invoices
- **Free trial** - 7-day trial period for new tenants without payment
- **Network infrastructure** - Manage routers, access points, and network topology
- **RADIUS integration** - Authentication server for VPN/PPPoE connections
- **Support system** - Ticketing and live chat between tenants and admins
- **Monitoring** - Real-time network statistics and device status
- **Admin dashboard** - Super admin interface for platform management

## User Roles

- **Super Admin** - Platform administrators managing all tenants
- **Tenant Admin** - ISP operators managing their own customers and infrastructure
- **Customer** - End users accessing self-service portal

## Technology Context

The platform consists of:
- Go backend API with PostgreSQL database
- Three React/TypeScript frontends (Homepage, User Dashboard, Admin Dashboard)
- Redis for caching and sessions
- RADIUS server for network authentication
- Docker/Kubernetes deployment

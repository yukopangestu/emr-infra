import { EnvironmentDefinition } from '../types/architecture';

const baseNodes = [
  { id: 'users', name: 'Internet Users', kind: 'Clients', zone: 'internet', purpose: 'Clinicians, patients, and partner systems', port: '443', ha: true },
  { id: 'cloudflare', name: 'Cloudflare', kind: 'DNS · WAF · DDoS', zone: 'edge', purpose: 'Authoritative DNS, edge WAF and DDoS protection', port: '443', ha: true },
  { id: 'alb', name: 'Application Load Balancer', kind: 'AWS ALB', zone: 'public', purpose: 'Origin load balancing and private service path routing', port: '443 → 8080', ha: true },
  { id: 'public-gateway', name: 'Public Gateway', kind: 'ECS Fargate', zone: 'application', purpose: 'Patient-facing and partner API ingress after ALB routing', port: '8080', ha: true },
  { id: 'admin-gateway', name: 'Admin Gateway', kind: 'ECS Fargate', zone: 'application', purpose: 'Administrative EMR API ingress with privileged access policy', port: '8080', ha: true },
  { id: 'user-service', name: 'User Service', kind: 'ECS Fargate', zone: 'application', purpose: 'Identity, MFA, facility membership and tenant-scoped RBAC policy', port: '8080', ha: true },
  { id: 'tenant-router', name: 'Tenant Resolution', kind: 'ECS Fargate', zone: 'application', purpose: 'Validates tenant claim and resolves an isolated database target', port: '8080', ha: true },
  { id: 'services', name: 'EMR Service Mesh', kind: 'ECS Fargate', zone: 'application', purpose: 'Patient, encounter, clinical, billing and core services', port: '8080', ha: true },
  { id: 'worker', name: 'Integration Workers', kind: 'ECS Fargate', zone: 'application', purpose: 'FHIR mapping, retries, billing and notifications', port: '8080', ha: true },
  { id: 'proxy', name: 'Tenant RDS Proxy Pool', kind: 'Connection Pool · per tenant', zone: 'data', purpose: 'Dedicated proxy target per tenant for connection pooling and isolation', port: '5432', ha: true },
  { id: 'rds', name: 'Tenant RDS Database', kind: 'Amazon RDS PostgreSQL', zone: 'data', purpose: 'Dedicated medical record database for one tenant', port: '5432', ha: true },
  { id: 'redis', name: 'Redis', kind: 'ElastiCache', zone: 'data', purpose: 'Cache, sessions, locks, and rate limiting', port: '6379', ha: true },
  { id: 'queue', name: 'Event Queue', kind: 'SQS + DLQ', zone: 'platform', purpose: 'Durable asynchronous integration events', port: 'HTTPS', ha: true },
  { id: 's3', name: 'Medical Documents', kind: 'Amazon S3', zone: 'platform', purpose: 'Reports, consent forms and attachments', port: 'HTTPS', ha: true },
  { id: 'registry', name: 'Tenant Registry', kind: 'Control Plane', zone: 'platform', purpose: 'Maps a verified tenant to its DB endpoint and scoped secret', port: 'HTTPS', ha: true },
  { id: 'audit', name: 'Audit Log', kind: 'Append-only audit stream', zone: 'platform', purpose: 'Immutable record of reads, writes, exports, restores and administrative actions', port: 'HTTPS', ha: true },
  { id: 'satu', name: 'SATUSEHAT / Partners', kind: 'External APIs', zone: 'external', purpose: 'FHIR and partner integrations', port: '443', ha: false },
] as const;

export const environments: EnvironmentDefinition[] = [
  { id: 'ideal', name: 'Production Ideal', region: 'ap-southeast-3 · Jakarta', azs: 3, ha: 'Full multi-AZ', dr: 'Jakarta warm standby · separate account', availability: '99.95%', cost: '~$8,800/mo + tenant data', tradeoff: 'Best in-country resilience for critical clinical workloads.', replicas: 3, database: 'Dedicated Multi-AZ RDS PostgreSQL per tenant', backup: 'PITR + encrypted same-region vault copy', security: 'Cloudflare WAF/DDoS, SSO, KMS, private endpoints', tenancy: { database: 'One Multi-AZ RDS PostgreSQL database per tenant', provisioning: 'Automated account onboarding and per-tenant secret', recovery: 'Per-tenant PITR plus same-region account copy' }, nodes: [...baseNodes] },
  { id: 'standard', name: 'Standard Production', region: 'ap-southeast-3 · Jakarta', azs: 2, ha: 'Partial multi-AZ', dr: 'Jakarta backup recovery · separate account', availability: '99.5%', cost: '~$650/mo + tenant data', tradeoff: 'Balanced production footprint with recoverable in-country trade-offs.', replicas: 2, database: 'Dedicated RDS PostgreSQL per tenant', backup: 'PITR + encrypted same-region snapshots', security: 'Cloudflare WAF/DDoS, SSO, KMS, private subnets', tenancy: { database: 'One dedicated RDS PostgreSQL database per tenant', provisioning: 'Automated provisioning with a scoped secret', recovery: 'Tenant-scoped PITR and encrypted same-region snapshots' }, nodes: [...baseNodes] },
  { id: 'staging', name: 'Staging / Development', region: 'ap-southeast-3 · Jakarta', azs: 1, ha: 'No HA', dr: 'Jakarta snapshot only', availability: 'Best effort', cost: '~$90/mo + tenant data', tradeoff: 'Low-cost validation environment; not for clinical production traffic.', replicas: 1, database: 'Dedicated single-AZ PostgreSQL per tenant', backup: 'Encrypted same-region weekly snapshot', security: 'Cloudflare baseline WAF/DDoS, SSO, KMS', tenancy: { database: 'One isolated development database per tenant', provisioning: 'Scripted tenant database provisioning', recovery: 'Tenant-scoped snapshots only in Jakarta' }, nodes: baseNodes.map((node) => ({ ...node, ha: false })) },
];

import { EnvironmentDefinition } from '../types/architecture';

const baseNodes = [
  { id: 'users', name: 'Internet Users', kind: 'Clients', zone: 'internet', purpose: 'Clinicians, patients, and partner systems', port: '443', ha: true },
  { id: 'cloudflare', name: 'Cloudflare', kind: 'DNS · WAF · DDoS', zone: 'edge', purpose: 'Global edge protection and DNS', port: '443', ha: true },
  { id: 'alb', name: 'Application Load Balancer', kind: 'AWS ALB', zone: 'public', purpose: 'TLS termination and path routing', port: '443 → 8080', ha: true },
  { id: 'gateway', name: 'Public + Admin Gateway', kind: 'ECS Fargate', zone: 'application', purpose: 'Authenticated ingress for EMR APIs', port: '8080', ha: true },
  { id: 'tenant-router', name: 'Tenant Resolution', kind: 'ECS Fargate', zone: 'application', purpose: 'Validates tenant claim and resolves an isolated database target', port: '8080', ha: true },
  { id: 'services', name: 'EMR Service Mesh', kind: 'ECS Fargate', zone: 'application', purpose: 'Patient, encounter, clinical, billing and core services', port: '8080', ha: true },
  { id: 'worker', name: 'Integration Workers', kind: 'ECS Fargate', zone: 'application', purpose: 'FHIR mapping, retries, billing and notifications', port: '8080', ha: true },
  { id: 'proxy', name: 'RDS Proxy', kind: 'Connection Pool', zone: 'data', purpose: 'Database connection protection', port: '5432', ha: true },
  { id: 'rds', name: 'Tenant RDS Database', kind: 'Amazon RDS PostgreSQL', zone: 'data', purpose: 'Dedicated medical record database for one tenant', port: '5432', ha: true },
  { id: 'redis', name: 'Redis', kind: 'ElastiCache', zone: 'data', purpose: 'Cache, sessions, locks, and rate limiting', port: '6379', ha: true },
  { id: 'queue', name: 'Event Queue', kind: 'SQS + DLQ', zone: 'platform', purpose: 'Durable asynchronous integration events', port: 'HTTPS', ha: true },
  { id: 's3', name: 'Medical Documents', kind: 'Amazon S3', zone: 'platform', purpose: 'Reports, consent forms and attachments', port: 'HTTPS', ha: true },
  { id: 'registry', name: 'Tenant Registry', kind: 'Control Plane', zone: 'platform', purpose: 'Maps a verified tenant to its DB endpoint and scoped secret', port: 'HTTPS', ha: true },
  { id: 'satu', name: 'SATUSEHAT / Partners', kind: 'External APIs', zone: 'external', purpose: 'FHIR and partner integrations', port: '443', ha: false },
] as const;

export const environments: EnvironmentDefinition[] = [
  { id: 'ideal', name: 'Production Ideal', region: 'ap-southeast-3 · Jakarta', azs: 3, ha: 'Full multi-AZ', dr: 'Singapore warm standby', availability: '99.95%', cost: '~$8,800/mo + tenant data', tradeoff: 'Best resilience for critical clinical workloads.', replicas: 3, database: 'Dedicated Multi-AZ RDS PostgreSQL per tenant', backup: 'PITR + cross-region replication', security: 'WAF, Shield, SSO, KMS, private endpoints', tenancy: { database: 'One Multi-AZ RDS PostgreSQL database per tenant', provisioning: 'Automated account onboarding and per-tenant secret', recovery: 'Per-tenant PITR plus cross-region copy' }, nodes: [...baseNodes] },
  { id: 'standard', name: 'Standard Production', region: 'ap-southeast-3 · Jakarta', azs: 2, ha: 'Partial multi-AZ', dr: 'Backup-based recovery', availability: '99.5%', cost: '~$650/mo + tenant data', tradeoff: 'Balanced production footprint with recoverable trade-offs.', replicas: 2, database: 'Dedicated RDS PostgreSQL per tenant', backup: 'PITR + encrypted daily snapshots', security: 'WAF, SSO, KMS, private subnets', tenancy: { database: 'One dedicated RDS PostgreSQL database per tenant', provisioning: 'Automated provisioning with a scoped secret', recovery: 'Tenant-scoped PITR and encrypted snapshots' }, nodes: [...baseNodes] },
  { id: 'staging', name: 'Staging / Development', region: 'ap-southeast-3 · Jakarta', azs: 1, ha: 'No HA', dr: 'Snapshot only', availability: 'Best effort', cost: '~$90/mo + tenant data', tradeoff: 'Low-cost validation environment; not for clinical production traffic.', replicas: 1, database: 'Dedicated single-AZ PostgreSQL per tenant', backup: 'Encrypted weekly snapshot', security: 'WAF baseline, SSO, KMS', tenancy: { database: 'One isolated development database per tenant', provisioning: 'Scripted tenant database provisioning', recovery: 'Tenant-scoped snapshots only' }, nodes: baseNodes.map((node) => ({ ...node, ha: false })) },
];

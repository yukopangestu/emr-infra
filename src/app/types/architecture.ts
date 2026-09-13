export type EnvironmentId = 'ideal' | 'standard' | 'staging';

export interface ArchitectureNode {
  id: string;
  name: string;
  kind: string;
  zone: 'internet' | 'edge' | 'public' | 'application' | 'data' | 'platform' | 'external';
  purpose: string;
  port: string;
  ha: boolean;
}

export interface EnvironmentDefinition {
  id: EnvironmentId;
  name: string;
  region: string;
  azs: number;
  ha: string;
  dr: string;
  availability: string;
  cost: string;
  tradeoff: string;
  replicas: number;
  database: string;
  backup: string;
  security: string;
  nodes: ArchitectureNode[];
}

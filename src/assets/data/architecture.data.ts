import { ArchitectureData } from '../../app/core/services/content.service';

export const architectureData: ArchitectureData = {
  title: 'Arsitektur produksi platform EMR multitenant',
  lede: '',
  metadata: {},
  sections: [
    {
      id: 'scope',
      number: 1,
      title: 'Asumsi & scope',
      content: '',
      diagram: { file: 'scope-assumptions.svg' }
    },
    {
      id: 's1',
      number: 2,
      title: 'Master architecture diagram',
      content: '',
      diagrams: [
        { file: 'master-diagram.svg' },
        { file: 'service-access-matrix.svg' }
      ]
    },
    {
      id: 'tenant-flow',
      number: 3,
      title: 'Alur tenant context & lifecycle',
      content: '',
      diagrams: [
        { file: 'tenant-context-flow.svg' },
        { file: 'tenant-routing-lifecycle.svg' }
      ]
    },
    {
      id: 's2',
      number: 4,
      title: 'Model isolasi tenant',
      content: '',
      diagrams: [
        { file: 'isolation-model.svg' },
        { file: 'isolation-boundaries.svg' }
      ]
    },
    {
      id: 's4',
      number: 5,
      title: 'Compute & platform placement',
      content: '',
      diagram: { file: 'compute-placement.svg' }
    },
    {
      id: 'reliability',
      number: 6,
      title: 'Reliability: SLO, observability & failure modes',
      content: '',
      diagram: { file: 'slo-failure-modes.svg' }
    },
    {
      id: 's8',
      number: 7,
      title: 'Deployment, CI/CD & migrasi',
      content: '',
      diagram: { file: 'cicd-pipeline-tests.svg' }
    },
    {
      id: 's7',
      number: 8,
      title: 'Backup & disaster recovery',
      content: '',
      diagrams: [
        { file: 'dr-failover.svg' },
        { file: 'dr-rpo-rto.svg' }
      ]
    },
    {
      id: 's5',
      number: 9,
      title: 'Security & encryption',
      content: '',
      diagrams: [
        { file: 'identity-trust-boundary.svg' },
        { file: 'defense-layers-kms.svg' }
      ]
    },
    {
      id: 's9',
      number: 10,
      title: 'Estimasi biaya & trade-off',
      content: '',
      diagram: { file: 'cost-tradeoffs.svg' }
    },
    {
      id: 'decisions',
      number: 11,
      title: 'Keputusan kunci & risiko',
      content: '',
      diagram: { file: 'adr-risks.svg' }
    }
  ]
};

import { AfterViewInit, Component, HostBinding, HostListener } from '@angular/core';
import { environments } from './data/environments';
import { ArchitectureNode, EnvironmentDefinition, EnvironmentId } from './types/architecture';

interface NavItem { id: string; label: string; }

@Component({ selector: 'app-root', templateUrl: './app.html', styleUrl: './app.scss' })
export class App implements AfterViewInit {
  readonly environments = environments;
  readonly nav: NavItem[] = [
    { id: 'overview', label: 'Overview' }, { id: 'diagram', label: 'Master Diagram' }, { id: 'routing', label: 'Routing Matrix' }, { id: 'tenancy', label: 'Tenant Isolation' },
    { id: 'placement', label: 'Host Placement' }, { id: 'security', label: 'Network & Security' },
    { id: 'dr', label: 'Backup & DR' }, { id: 'observability', label: 'Observability' }, { id: 'cicd', label: 'CI/CD' }, { id: 'cost', label: 'Cost Estimation' },
  ];
  selectedId: EnvironmentId = 'ideal';
  activeSection = 'overview';
  selectedNode: ArchitectureNode | null = null;
  diagramScale = 1;
  @HostBinding('class.light-theme') isLight = false;
  readonly services = ['Clinic', 'Transaction', 'Core', 'HR', 'Utility', 'Patient', 'Encounter', 'Clinical', 'Billing', 'Integration'];

  get selected(): EnvironmentDefinition { return this.environments.find((env) => env.id === this.selectedId)!; }
  get zoneNodes(): Record<string, ArchitectureNode[]> { return this.selected.nodes.reduce<Record<string, ArchitectureNode[]>>((acc, node) => { (acc[node.zone] ??= []).push(node); return acc; }, {}); }
  selectEnvironment(id: EnvironmentId): void { this.selectedId = id; this.selectedNode = null; this.diagramScale = 1; }
  selectNode(node: ArchitectureNode): void { this.selectedNode = node; }
  zoom(delta: number): void { this.diagramScale = Math.max(.72, Math.min(1.35, this.diagramScale + delta)); }
  resetView(): void { this.diagramScale = 1; this.selectedNode = null; }
  toggleTheme(): void {
    this.isLight = !this.isLight;
    if (typeof localStorage !== 'undefined') localStorage.setItem('emr-architecture-theme', this.isLight ? 'light' : 'dark');
  }
  scrollTo(id: string): void { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  ngAfterViewInit(): void {
    if (typeof localStorage !== 'undefined') this.isLight = localStorage.getItem('emr-architecture-theme') === 'light';
    this.updateActive();
  }
  @HostListener('window:scroll') onScroll(): void { this.updateActive(); }
  private updateActive(): void { const hit = this.nav.find(({ id }) => { const el = document.getElementById(id); return el ? el.getBoundingClientRect().top >= 80 && el.getBoundingClientRect().top < 320 : false; }); if (hit) this.activeSection = hit.id; }
}

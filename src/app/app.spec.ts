import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    })
      .compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the architecture title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Arsitektur produksi platform EMR multitenant');
  });

  it('should render the readiness sections and all architecture diagrams', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelectorAll('.document-section')).toHaveLength(14);
    expect(compiled.textContent).toContain('Apa itu EMR');
    expect(compiled.textContent).toContain('BR-01');
    expect(compiled.textContent).toContain('BLOCKED');
    expect(compiled.textContent).toContain('Risk register');
    expect(compiled.querySelector('img[src="/assets/diagrams/master-diagram.svg"]')).toBeTruthy();
    expect(compiled.querySelector('img[src="/assets/diagrams/isolation-model.svg"]')).toBeTruthy();
    expect(compiled.querySelector('img[src="/assets/diagrams/dr-failover.svg"]')).toBeTruthy();
    expect(compiled.querySelector('img[src="/assets/diagrams/identity-trust-boundary.svg"]')).toBeTruthy();
  });
});

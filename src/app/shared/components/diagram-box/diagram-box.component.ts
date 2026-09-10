import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-diagram-box',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './diagram-box.component.html',
  styleUrl: './diagram-box.component.scss',
})
export class DiagramBoxComponent {
  @Input() diagramFile!: string;
  @Input() caption?: string;
  @Input() altText = 'Architecture diagram';

  get diagramSrc(): string {
    return `/assets/diagrams/${this.diagramFile}`;
  }
}

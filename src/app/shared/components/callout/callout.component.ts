import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Callout } from '../../../core/services/content.service';

@Component({
  selector: 'app-callout',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './callout.component.html',
  styleUrl: './callout.component.scss',
})
export class CalloutComponent {
  @Input() callout!: Callout;

  get calloutClass(): string {
    return `callout callout--${this.callout.type}`;
  }

  get contentHtml(): string {
    return this.callout.content.replaceAll('\n\n', '<br><br>');
  }
}

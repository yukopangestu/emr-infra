import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Section } from '../../../core/services/content.service';

@Component({
  selector: 'app-sidebar-nav',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar-nav.component.html',
  styleUrl: './sidebar-nav.component.scss',
})
export class SidebarNavComponent {
  @Input() sections: Section[] = [];
  @Input() mobileOpen = false;
  @Output() navigate = new EventEmitter<string>();
}

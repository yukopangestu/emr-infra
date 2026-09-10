import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Table } from '../../../core/services/content.service';

@Component({
  selector: 'app-table-component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './table-component.component.html',
  styleUrl: './table-component.component.scss',
})
export class TableComponentComponent {
  @Input() table!: Table;
}

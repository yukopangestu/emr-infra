import { Injectable } from '@angular/core';
import { architectureData } from '../../../assets/data/architecture.data';

export interface Table {
  headers: string[];
  rows: string[][];
}

export interface Callout {
  type: 'info' | 'warning' | 'note';
  content: string;
}

export interface Section {
  id: string;
  number: number;
  title: string;
  content: string;
  subheading?: string;
  subheadingDescription?: string;
  diagram?: { file: string; caption: string };
  tables?: Table[];
  callouts?: Callout[];
  cards?: { title: string; description: string }[];
  steps?: { title: string; description: string; isGate?: boolean }[];
  numberedList?: string[];
  postContent?: string[];
}

export interface ArchitectureData {
  title: string;
  lede: string;
  metadata: Record<string, string>;
  sections: Section[];
  footer?: string;
}

@Injectable({ providedIn: 'root' })
export class ContentService {
  getArchitectureData(): ArchitectureData {
    return architectureData;
  }

  getSectionById(id: string): Section | undefined {
    return architectureData.sections.find((s) => s.id === id);
  }

  getAllSections(): Section[] {
    return architectureData.sections;
  }
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SectorId = 'algorithm' | 'ontology' | 'application';

export interface SectorConfig {
  id: SectorId;
  name: string;
  icon: string; // Lucide icon name
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  details: {
    specs: string[];
    capabilities: string[];
    benchmarks: { label: string; value: string }[];
    useCases: string[];
  };
  gridPosition: string; // Tailwind class or placement info
}

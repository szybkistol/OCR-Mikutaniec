
export type FieldType = 'text' | 'number' | 'date';

export interface SchemaField {
  id: string;
  name: string;
  type: FieldType;
  description: string;
}

export interface ExtractedItem {
  value: string | number | null;
  source: string | null;
}

export interface AggregatedResult {
  data: Record<string, ExtractedItem>;
  status: 'success' | 'error';
  error?: string;
}

export interface Account {
  name: string;
  id: string;
}

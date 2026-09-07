export interface SearchResultItem {
  id: string;
  title: string;
  subtitle?: string;
}

export interface SearchResults {
  questions: SearchResultItem[];
  materials: SearchResultItem[];
  tests: SearchResultItem[];
}

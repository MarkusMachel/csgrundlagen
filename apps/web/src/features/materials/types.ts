export type MaterialType = 'book' | 'video' | 'article' | 'link';

export interface MaterialItem {
  id: string;
  type: MaterialType;
  title: string;
  url: string;
  author?: string;
  description?: string;
  tags: string[];
  relatedQuestionIds?: string[];
}

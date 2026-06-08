export interface ResultPublication {
  id: string;
  session: string;
  class_field: string;
  class_name: string;
  section: string;
  section_name: string;
  status: 'draft' | 'under_review' | 'published' | 'unpublished';
  published_by: string | null;
  published_by_email: string | null;
  published_at: string | null;
  remarks: string;
  created_at: string;
  updated_at: string;
}

export interface PublicationSummary {
  total: number;
  draft: number;
  under_review: number;
  published: number;
  unpublished: number;
}

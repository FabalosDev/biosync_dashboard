// src/types/content.ts
export type ContentType =
  | "content"
  | "regenerated"
  | "news" // news content
  | "journals" // news rss
  | "rss";

export interface ContentItem {
  // common
  status?: "Pending" | "Approved" | "Rejected" | string;
  rowNumber?: number;
  row?: number;

  // media/caption
  imageGenerated?: string;
  regeneratedImage?: string;
  caption?: string;

  // article-ish
  title?: string;
  articleTitle?: string;
  contentSnippet?: string;
  articleText?: string;
  articleAuthors?: string;
  source?: string;
  inputText?: string;
  linkToArticle?: string;

  // extra metadata you wanted to show
  priority?: string;
  truthScore?: string | number;
  category?: string;
  keywords?: string;
  dup?: string; // Maybe Duplicate? (Dedup marker)

  // anything else you might pass through:
  sheet?: string;
}

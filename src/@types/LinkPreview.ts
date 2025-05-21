export type LinkPreviewData = {
  url: string;
  title?: string;
  siteName?: string;
  description?: string;
  images?: string[];
  mediaType?: 'website' | 'video' | 'article' | string;
  contentType?: string;
  favicons?: string[];
};

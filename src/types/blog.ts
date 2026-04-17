export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  category: string;
  excerpt: string;
  coverImage?: string;
  featured?: boolean;
  linkedinCarousel?: boolean;
  content: string;
  readingTime?: string;
  issue: number;
}

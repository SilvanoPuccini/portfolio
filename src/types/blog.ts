export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  category: string;
  displayCategory?: string;
  excerpt: string;
  coverImage?: string;
  ogImage?: string;
  keyword?: string;
  featured?: boolean;
  linkedinCarousel?: boolean;
  content: string;
  readingTime?: string;
  issue: number;
}

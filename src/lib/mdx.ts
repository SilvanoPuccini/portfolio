import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import type { BlogPost } from '@/types/blog';

export type { BlogPost };

const blogDirectory = path.join(process.cwd(), 'src/content/blog');

export function getAllBlogPosts(): BlogPost[] {
  if (!fs.existsSync(blogDirectory)) {
    return [];
  }

  const files = fs.readdirSync(blogDirectory);

  const posts = files
    .filter(file => file.endsWith('.mdx'))
    .map(file => {
      const slug = file.replace(/\.mdx$/, '');
      const fullPath = path.join(blogDirectory, file);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data, content } = matter(fileContents);

      return {
        slug,
        title: data.title,
        date: data.date,
        category: data.category,
        excerpt: data.excerpt,
        coverImage: data.coverImage,
        featured: data.featured || false,
        linkedinCarousel: data.linkedinCarousel || false,
        content,
        readingTime: data.readingTime || '5 min',
        issue: 0, // se asigna abajo
      };
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Asignar número de edición: el más antiguo = Nº 1
  posts.forEach((post, i) => { post.issue = i + 1; });

  // Devolver ordenados del más nuevo al más antiguo
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const fullPath = path.join(blogDirectory, `${slug}.mdx`);

  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  // Obtener el número de edición desde la lista completa ordenada
  const all = getAllBlogPosts();
  const issue = all.find(p => p.slug === slug)?.issue ?? 0;

  return {
    slug,
    title: data.title,
    date: data.date,
    category: data.category,
    excerpt: data.excerpt,
    coverImage: data.coverImage,
    featured: data.featured || false,
    linkedinCarousel: data.linkedinCarousel || false,
    content,
    readingTime: data.readingTime || '5 min',
    issue,
  };
}
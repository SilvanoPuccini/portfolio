import { PostCard } from "@/components/blog/PostCard";
import type { BlogPost } from "@/lib/mdx";

interface BlogGridProps {
  posts: BlogPost[];
  locale?: string;
}

export default function BlogGrid({ posts, locale = 'es' }: BlogGridProps) {
  if (posts.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {posts.map((post) => (
        <PostCard
          key={post.slug}
          slug={post.slug}
          title={post.title}
          date={post.date}
          category={post.category}
          excerpt={post.excerpt}
          readingTime={post.readingTime}
          locale={locale}
        />
      ))}
    </div>
  );
}
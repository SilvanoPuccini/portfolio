import BlogCard from "@/components/blocks/BlogCard";

type BlogGridPost = {
  slug: string;
  accent: "cyan" | "blue" | "slate" | "amber";
  category: string;
  excerpt: string;
  layout: "standard" | "wide";
  publishedAt: string;
  readingTime: string;
  temporaryLabel: string;
  title: string;
};

export default function BlogGrid({
  posts,
  readMoreLabel,
  exploreLabel,
}: {
  posts: BlogGridPost[];
  readMoreLabel: string;
  exploreLabel: string;
}) {
  if (posts.length === 0) {
    return null;
  }

  const standardPosts = posts.filter((post) => post.layout !== "wide");
  const widePost = posts.find((post) => post.layout === "wide");
  const leadingPosts = standardPosts.slice(0, 3);
  const trailingPosts = widePost
    ? [...standardPosts.slice(3, 4), widePost, ...standardPosts.slice(4)]
    : standardPosts.slice(3);

  return (
    <div className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {leadingPosts.map((post) => (
          <BlogCard key={post.slug} post={post} readMoreLabel={readMoreLabel} exploreLabel={exploreLabel} />
        ))}
      </div>

      {trailingPosts.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {trailingPosts.map((post) => (
            <BlogCard
              key={post.slug}
              post={post}
              variant={post.layout === "wide" ? "wide" : "standard"}
              readMoreLabel={readMoreLabel}
              exploreLabel={exploreLabel}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

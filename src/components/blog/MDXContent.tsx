import { MDXRemote } from 'next-mdx-remote/rsc';

interface Props {
  source: string;
}

export function MDXContent({ source }: Props) {
  return (
    <div className="
      prose prose-invert max-w-none
      prose-headings:font-semibold prose-headings:text-text-primary
      prose-h1:text-4xl prose-h1:leading-tight prose-h1:mb-8
      prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:border-b prose-h2:border-outline-ghost/15 prose-h2:pb-3
      prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
      prose-p:text-text-secondary prose-p:leading-8 prose-p:text-[1.05rem]
      prose-a:text-brand-primary prose-a:no-underline hover:prose-a:underline
      prose-strong:text-text-primary prose-strong:font-semibold
      prose-code:text-brand-primary prose-code:bg-surface-elevated/60 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
      prose-pre:bg-surface-elevated/60 prose-pre:border prose-pre:border-outline-ghost/20 prose-pre:rounded-xl prose-pre:text-sm
      prose-blockquote:border-l-2 prose-blockquote:border-brand-primary/50 prose-blockquote:pl-6 prose-blockquote:text-text-secondary prose-blockquote:not-italic
      prose-ul:text-text-secondary prose-ol:text-text-secondary
      prose-li:leading-8 prose-li:text-[1.05rem]
      prose-hr:border-outline-ghost/20 prose-hr:my-10
    ">
      <MDXRemote source={source} />
    </div>
  );
}

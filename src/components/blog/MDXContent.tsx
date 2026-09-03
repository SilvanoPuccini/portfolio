import { MDXRemote } from 'next-mdx-remote/rsc';
import rehypePrettyCode from 'rehype-pretty-code';
import remarkGfm from 'remark-gfm';
import { DownloadGuides, Eyebrow, ImageShot, Row, Zoomable } from './PostRich';
import { CodeBlock } from './CodeBlock';
import { DevelopmentCycleDiagram, TestingQaDiagram } from './diagrams/DevelopmentCycleDiagrams';
import { CierreDiagram } from './diagrams/CierreDiagram';
import {
  StackDiagramBlock,
  CommandsDiagramBlock,
  CloneToPublishDiagramBlock,
  WarpBlocksDiagramBlock,
  PromptDetailDiagramBlock,
  EditorWslDiagramBlock,
  ModelSwapDiagramBlock,
  VerificationDiagramBlock,
} from './diagrams/EntornoDiagrams';
import { FiveDecisionsDiagramBlock, StackHeroBlock } from './diagrams/StackDecisionsDiagram';
import { StackReferenceTable } from './diagrams/StackReferenceTable';

const mdxComponents = {
  DownloadGuides, Eyebrow, ImageShot, Row, Zoomable, pre: CodeBlock,
  DevelopmentCycleDiagram, TestingQaDiagram, CierreDiagram,
  StackDiagramBlock, CommandsDiagramBlock, CloneToPublishDiagramBlock, WarpBlocksDiagramBlock,
  PromptDetailDiagramBlock, EditorWslDiagramBlock, ModelSwapDiagramBlock, VerificationDiagramBlock,
  FiveDecisionsDiagramBlock, StackHeroBlock, StackReferenceTable,
};

const mdxOptions = {
  mdxOptions: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      [rehypePrettyCode, { theme: 'one-dark-pro', keepBackground: true }],
    ],
  },
} as Parameters<typeof MDXRemote>[0]['options'];

interface Props {
  source: string;
}

export function MDXContent({ source }: Props) {
  return (
    <div className="
      prose prose-invert max-w-none

      prose-headings:font-semibold prose-headings:text-text-primary prose-headings:tracking-tight

      prose-h2:text-3xl prose-h2:mt-14 prose-h2:mb-6
      prose-h2:border-b prose-h2:border-outline-ghost/15 prose-h2:pb-4

      prose-h3:text-xl prose-h3:mt-10 prose-h3:mb-4 prose-h3:text-text-primary

      prose-p:text-text-secondary prose-p:leading-8 prose-p:text-[1.05rem] prose-p:mb-6

      prose-a:text-brand-primary prose-a:no-underline hover:prose-a:underline

      prose-strong:text-text-primary prose-strong:font-semibold

      prose-code:text-brand-primary prose-code:bg-surface-elevated/60 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none

      prose-pre:text-[12.5px] prose-pre:whitespace-pre-wrap prose-pre:break-words

      prose-blockquote:border-l-2 prose-blockquote:border-brand-primary/50 prose-blockquote:pl-6 prose-blockquote:py-1 prose-blockquote:text-text-secondary prose-blockquote:not-italic prose-blockquote:my-8

      prose-ul:text-text-secondary prose-ul:my-6
      prose-ol:text-text-secondary prose-ol:my-6
      prose-li:leading-8 prose-li:text-[1.05rem] prose-li:my-1

      prose-hr:border-outline-ghost/20 prose-hr:my-12

      prose-table:w-full prose-table:text-sm prose-table:border-collapse
      prose-thead:bg-surface-elevated/60
      prose-th:text-text-primary prose-th:font-semibold prose-th:py-3 prose-th:px-5 prose-th:text-left prose-th:border prose-th:border-outline-ghost/20
      prose-td:text-text-secondary prose-td:py-3 prose-td:px-5 prose-td:border prose-td:border-outline-ghost/10
      prose-tr:even:bg-surface-dim/40
    ">
      <MDXRemote source={source} options={mdxOptions} components={mdxComponents} />
    </div>
  );
}

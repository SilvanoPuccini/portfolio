# Maintain the local prose styles

The application uses local, generated typography CSS instead of the vulnerable selector-parser dependency shipped by @tailwindcss/typography. Tailwind 4 still generates ordinary utilities and all prose element variants. Application content and theme tokens are unchanged.

## Source and scope

- Source: @tailwindcss/typography 0.5.19 with Tailwind CSS 3.4.19, from baseline commit 72304fc022714162e4e00b015f99ee2ac2d83b11.
- Generated source CSS SHA-256: `3b5358dece24bf8aeaa9e0f041280ac2bc985a062c4f8a15c4d33c29d83efe8a`.
- License: unmodified upstream MIT text in src/app/typography-LICENSE; SHA-256 `60e0b68c0f35c078eef3a5d29419d0b03ff84ec1df9c3f9d6e39a519a5ae7985`.
- All 29 declared prose modifiers are retained, not only the currently used classes. No application reset or unrelated utility CSS is vendored.

## Editing and regeneration

The generated file contains Tailwind 4 `@utility` definitions. Their declarations and descendant selectors come directly from the baseline plugin's generated component CSS. The enclosing class selector becomes `&`; this preserves specificity and allows responsive, dark and other Tailwind variants. The element variants in globals.css preserve the upstream low-specificity selectors and not-prose exclusion.

For deliberate typography updates, use an isolated baseline checkout with the pinned source versions and existing tailwind.config.ts. Compile only `@tailwind components;`, with a safelist matching `/^prose(?:-|$)/`. Group the emitted rules by their initial prose class; wrap each group in `@utility <class>` and replace only that initial class selector with `&`. Keep every declaration, selector and modifier. Copy the upstream license without alteration. Never reinstall the vulnerable plugin into the application's dependency graph.

Review generated changes against representative headings, links, lists, blockquotes, code, tables, figures, not-prose descendants and all size modifiers. Compare computed browser styles at mobile and desktop widths, in both themes, including hover/focus and responsive variants. Then run typecheck, lint, the complete Vitest suite, the Webpack build and a whole installed-graph advisory check. A new modifier requires an explicit local utility and the same checks; do not silently discard unsupported modifiers.

export type Locale = "es" | "en";

export type Localized<T> = Record<Locale, T>;

export type LinkTarget = {
  label: string;
  href: string;
};

export type ContentSource = {
  label: string;
  url: string;
};

export type NavigationKey =
  | "home"
  | "projects"
  | "services"
  | "blog"
  | "about"
  | "contact";

export type NavigationItem = {
  key: NavigationKey;
  href: string;
  label: Localized<string>;
};

export type SocialLink = LinkTarget & {
  platform: "github" | "linkedin" | "email" | "discord" | "portfolio";
};

export type SiteMetadata = {
  siteName: string;
  role: Localized<string>;
  description: Localized<string>;
  siteUrl: string;
  defaultLocale: Locale;
  location: string;
  availability: Localized<string>;
  email: string;
  phone: string;
  cv: {
    fileName: string;
    downloadHref: string;
    sourcePath: string;
  };
  socialLinks: SocialLink[];
  sourceUrls: string[];
};

export type HomeContent = {
  eyebrow: Localized<string>;
  title: Localized<string>;
  subtitle: Localized<string>;
  intro: Localized<string>;
  narrative: Localized<string[]>;
  ctas: Localized<LinkTarget[]>;
  featuredProjectSlugs: string[];
  sourceUrls: string[];
};

export type SkillGroup = {
  title: Localized<string>;
  items: string[];
};

export type ExperienceHighlight = {
  title: Localized<string>;
  context: Localized<string>;
  detail: Localized<string>;
};

export type EducationItem = {
  title: Localized<string>;
  institution: string;
  period: Localized<string>;
  detail: Localized<string>;
};

export type AboutContent = {
  eyebrow: Localized<string>;
  title: Localized<string>;
  summary: Localized<string[]>;
  strengths: Localized<string[]>;
  languages: Localized<string[]>;
  education: EducationItem[];
  experience: ExperienceHighlight[];
  skillGroups: SkillGroup[];
  cvLabel: Localized<string>;
  sourceUrls: string[];
};

export type ServiceItem = {
  slug: string;
  subtitle: Localized<string>;
  title: Localized<string>;
  description: Localized<string>;
  proofPoints: Localized<string[]>;
  sourceUrls: string[];
};

export type BlogContent = {
  eyebrow: Localized<string>;
  title: Localized<string>;
  titleAccent: Localized<string>;
  intro: Localized<string>;
  emptyState: Localized<string>;
  featuredLabel: Localized<string>;
  latestLabel: Localized<string>;
  editorialNote: Localized<string>;
  newsletter: {
    title: Localized<string>;
    intro: Localized<string>;
    inputPlaceholder: Localized<string>;
    ctaLabel: Localized<string>;
    helper: Localized<string>;
  };
  sourceUrls: string[];
};

export type ContactContent = {
  eyebrow: Localized<string>;
  title: Localized<string>;
  intro: Localized<string>;
  availability: Localized<string>;
  primaryCtas: Localized<LinkTarget[]>;
  formspreeAction: string;
  sourceUrls: string[];
};

export type ProjectCategory = "web-app" | "platform" | "ecommerce" | "automation";
export type ProjectStatus = "live" | "beta" | "case-study";
export type AssetStatus = "real" | "placeholder";

export type Project = {
  slug: string;
  name: string;
  featured: boolean;
  priority: boolean;
  category: ProjectCategory;
  status: ProjectStatus;
  year: string;
  headline: Localized<string>;
  summary: Localized<string>;
  challenge: Localized<string>;
  impact: Localized<string[]>;
  stack: string[];
  links: {
    demo?: string;
    repo?: string;
  };
  demoAccess?: Localized<{
    label: string;
    credentials: string;
  }>;
  media: {
    cover: string;
    alt: Localized<string>;
    assetStatus: AssetStatus;
  };
  sourceUrls: string[];
};

export type SiteContent = {
  metadata: SiteMetadata;
  navigation: NavigationItem[];
  home: HomeContent;
  about: AboutContent;
  services: ServiceItem[];
  blog: BlogContent;
  contact: ContactContent;
  projects: Project[];
};

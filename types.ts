// This file defines shared TypeScript types used across the application.

import { getT } from './i18n';

// --- General ---
export type Language = 'en' | 'es' | 'fr' | 'de' | 'ar';
export type LanguageCode = 'en' | 'ar';
export type Translator = ReturnType<typeof getT>;

export interface LanguageContextType {
    language: LanguageCode;
    setLanguage: (lang: LanguageCode) => void;
    t: Translator;
    dir: 'ltr' | 'rtl';
}

export interface Notification {
  message: string;
  type: 'success' | 'error' | 'info';
}

// --- WordPress ---
export interface WordPressSite {
  id: string;
  url: string;
  name: string;
  username: string;
  appPassword: string;
  stats: {
    posts: number;
    pages: number;
    products: number;
  };
  isVirtual?: boolean;
}

export interface WordPressCategory {
    id: number;
    name: string;
    count: number;
}

export interface WordPressPost {
    id: number;
    title: string;
    link: string;
    type: 'post' | 'product';
}

export interface SiteContext {
    recentPosts: { title: string; url: string }[];
    categories: WordPressCategory[];
    tags: { id: number; name: string }[];
}

// --- Content ---
export enum ContentType {
    Article = 'article',
    Product = 'product',
}

export enum ContentStatus {
    Draft = 'draft',
    Published = 'published',
    Scheduled = 'scheduled',
}

interface BaseContent {
  id: string;
  type: ContentType;
  title: string;
  metaDescription: string;
  status: 'draft' | 'published' | 'scheduled';
  createdAt: Date;
  updatedAt?: Date;
  siteId?: string; // ID of the WordPress site it was published to
  wordpressId?: number; // Post ID on WordPress
  wordpressUrl?: string; // URL on WordPress
  scheduledFor?: string; // ISO date string
}

export interface ArticleContent extends BaseContent {
  type: ContentType.Article;
  body: string;
  featuredImageUrl?: string;
  featuredImagePrompt?: string;
}

export interface ProductContent extends BaseContent {
  type: ContentType.Product;
  longDescription: string;
  shortDescription: string;
  galleryImageUrls?: string[];
}

export type GeneratedContent = ArticleContent | ProductContent;


// --- Publishing ---
export interface PublishingOptions {
    siteId: string;
    status: 'publish' | 'draft' | 'pending';
    action: 'create' | 'update';
    postId?: number;
    categories?: number[];
}


// --- AI Service ---
export type WritingTone = 'Professional' | 'Casual' | 'Enthusiastic' | 'Informative' | 'Humorous';
export type ArticleLength = 'Short (~500 words)' | 'Medium (~1000 words)' | 'Long (~2000 words)';

export interface SeoAnalysis {
    score: number;
    suggestions: string[];
}

export interface KeywordSuggestion {
    keyword: string;
    volume: 'Low' | 'Medium' | 'High';
    difficulty: 'Low' | 'Medium' | 'High';
}

export interface CompetitorAnalysis {
    mainTopics: string[];
    identifiedKeywords: string[];
    suggestions: string[];
}

export interface InternalLinkSuggestion {
    anchorText: string;
    linkToTitle: string;
    reasoning: string;
}

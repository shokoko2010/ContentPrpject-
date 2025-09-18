// services/wordpressService.ts

import { WordPressSite, GeneratedContent, PublishingOptions, SiteContext, ContentType, WordPressCategory, WordPressPost } from '../types';

// Mock function to simulate network delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));


export const addSite = async (url: string, username: string, appPassword: string): Promise<WordPressSite> => {
    await delay(1000);
    
    // Basic URL validation and cleaning
    let cleanedUrl: string;
    try {
        const urlObject = new URL(url);
        cleanedUrl = urlObject.origin;
    } catch (err) {
        throw new Error("Invalid URL format provided.");
    }
    
    if (!username || !appPassword) {
        throw new Error("Username and Application Password are required.");
    }

    // Simulate an API check - for demo, we'll just succeed
    if (url.includes("fail")) {
        throw new Error("Could not connect to the WordPress site. Please check credentials.");
    }

    // Simulate fetching site name
    const siteName = new URL(cleanedUrl).hostname.replace('www.', '').split('.')[0];
    const capitalizedSiteName = siteName.charAt(0).toUpperCase() + siteName.slice(1);

    const newSite: WordPressSite = {
        id: cleanedUrl,
        url: cleanedUrl,
        name: `${capitalizedSiteName} Site`,
        username,
        appPassword,
        stats: {
            posts: Math.floor(Math.random() * 100),
            pages: Math.floor(Math.random() * 20),
            products: Math.floor(Math.random() * 50),
        },
    };

    return newSite;
};

export const testSiteConnection = async (site: WordPressSite): Promise<{ success: boolean; error?: string }> => {
    await delay(800);
    if (site.url.includes("fail")) {
        return { success: false, error: "Authentication failed (401)." };
    }
    return { success: true };
};

export const getSiteContext = async (site: WordPressSite): Promise<SiteContext> => {
    await delay(1200);
    
    // Mock context data
    return {
        recentPosts: [
            { title: "The Future of Web Design", url: `${site.url}/future-of-web-design` },
            { title: "10 Tips for Better SEO", url: `${site.url}/10-seo-tips` },
            { title: "Our Company's New Product Launch", url: `${site.url}/new-product-launch` },
        ],
        categories: await getSiteCategories(site),
        tags: [
            { id: 10, name: "webdev" },
            { id: 12, name: "seo" },
            { id: 15, name: "business" },
        ],
    };
};

export const getSiteCategories = async (site: WordPressSite): Promise<WordPressCategory[]> => {
    await delay(700);
    if (site.url.includes("fail")) {
        throw new Error("Failed to fetch categories.");
    }
    // Mock categories data
    return [
        { id: 1, name: "Technology", count: 12 },
        { id: 2, name: "Marketing", count: 8 },
        { id: 5, name: "Business Strategy", count: 5 },
        { id: 8, name: "Uncategorized", count: 2 },
        { id: 11, name: "Productivity", count: 7 },
    ];
};

export const getSitePosts = async (site: WordPressSite, type: 'post' | 'product'): Promise<WordPressPost[]> => {
    await delay(900);
    if (site.url.includes("fail")) {
        throw new Error("Failed to fetch existing posts.");
    }
    // Mock posts data
    if (type === 'post') {
        return [
            { id: 101, title: "10 AI Tools That Will Change Your Business", link: `${site.url}/10-ai-tools`, type: 'post' },
            { id: 102, title: "A Guide to Sustainable Web Design", link: `${site.url}/sustainable-web-design`, type: 'post' },
            { id: 103, title: "Understanding The Stock Market in 2024", link: `${site.url}/stock-market-2024`, type: 'post' },
        ];
    }
    return [
        { id: 201, title: "Ergonomic Office Chair Pro", link: `${site.url}/products/ergonomic-chair`, type: 'product' },
        { id: 202, title: "Mechanical Keyboard X1", link: `${site.url}/products/keyboard-x1`, type: 'product' },
    ];
};

export const publishContent = async (
    site: WordPressSite, 
    content: GeneratedContent, 
    options: PublishingOptions
): Promise<{ postUrl: string; postId: number }> => {
    await delay(1500);

    if (site.url.includes("publish-fail")) {
        throw new Error("The server returned an error (500).");
    }

    const slug = content.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const postType = content.type === ContentType.Product ? 'product' : 'post';
    
    if (options.action === 'update' && options.postId) {
        console.log(`UPDATING post ${options.postId} on ${site.url}`, { content, options });
        return { postUrl: `${site.url}/${postType}/${slug}`, postId: options.postId };
    }
    
    console.log(`CREATING new content on ${site.url}`, { content, options });
    const newPostId = Math.floor(Math.random() * 10000) + 1;
    return { postUrl: `${site.url}/${postType}/${slug}`, postId: newPostId };
};

export const getSiteStats = async (site: WordPressSite): Promise<{ posts: number; pages: number; products: number; }> => {
    await delay(500);
    // Return the stored stats or generate new random ones
    return site.stats || {
        posts: Math.floor(Math.random() * 100),
        pages: Math.floor(Math.random() * 20),
        products: Math.floor(Math.random() * 50),
    };
};

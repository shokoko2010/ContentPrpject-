import { GoogleGenAI, Type } from "@google/genai";
import { ArticleContent, ContentType, Language, ProductContent, SiteContext, WritingTone, ArticleLength, SeoAnalysis, KeywordSuggestion, CompetitorAnalysis, InternalLinkSuggestion } from '../types';

const BRAND_VOICE_STORAGE_KEY = 'brand_voice';

/**
 * Initializes the AI client.
 * Throws an error if the API key is missing from environment variables.
 */
const getAiClient = (): GoogleGenAI => {
    // FIX: API key is now sourced from environment variables as per guidelines.
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        // FIX: Updated error message to reflect the new API key source.
        throw new Error("API_KEY environment variable not set. Please configure it on the server.");
    }
    try {
        // FIX: Initialization now uses a named parameter as per guidelines.
        return new GoogleGenAI({ apiKey });
    } catch (e) {
        console.error("Error initializing GoogleGenAI:", e);
        // FIX: Provide a more generic error if initialization fails.
        throw new Error("Could not initialize the AI client.");
    }
};

const articleSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "A compelling, SEO-friendly title for the article. It should be catchy and relevant." },
        metaDescription: { type: Type.STRING, description: "An SEO-friendly meta description, between 150-160 characters." },
        body: { type: Type.STRING, description: "The full body of the article, formatted with markdown. It must include an introduction, at least two relevant H2 (##) subheadings, and a conclusion. Use lists and bolding where appropriate." },
    },
    required: ["title", "metaDescription", "body"],
};

const productSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "A catchy and descriptive product title." },
        metaDescription: { type: Type.STRING, description: "An SEO-friendly meta description for the product, between 150-160 characters." },
        longDescription: { type: Type.STRING, description: "A detailed, persuasive, and comprehensive description of the product, highlighting its benefits and features. Use markdown for formatting." },
        shortDescription: { type: Type.STRING, description: "A concise summary of the product, perfect for category or archive pages." },
    },
    required: ["title", "metaDescription", "longDescription", "shortDescription"],
};

const contentStrategySchema = {
    type: Type.ARRAY,
    items: articleSchema
};

const seoAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        score: { type: Type.INTEGER, description: "An overall SEO score from 0 to 100 for the article, based on keyword usage, readability, structure, and title quality." },
        suggestions: {
            type: Type.ARRAY,
            description: "A list of 3-5 concrete, actionable suggestions for improving the article's SEO.",
            items: { type: Type.STRING }
        },
    },
    required: ["score", "suggestions"],
};

const keywordsSchema = {
    type: Type.OBJECT,
    properties: {
        keywords: {
            type: Type.ARRAY,
            description: "A list of 10-15 relevant SEO keywords.",
            items: {
                type: Type.OBJECT,
                properties: {
                    keyword: { type: Type.STRING },
                    volume: { type: Type.STRING, enum: ['Low', 'Medium', 'High'], description: "Estimated search volume." },
                    difficulty: { type: Type.STRING, enum: ['Low', 'Medium', 'High'], description: "Estimated ranking difficulty." },
                },
                required: ["keyword", "volume", "difficulty"]
            }
        },
    },
    required: ["keywords"],
};

const competitorAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        mainTopics: {
            type: Type.ARRAY,
            description: "A list of the main topics and themes covered in the competitor's article.",
            items: { type: Type.STRING }
        },
        identifiedKeywords: {
            type: Type.ARRAY,
            description: "A list of primary and secondary keywords the competitor article seems to be targeting.",
            items: { type: Type.STRING }
        },
        suggestions: {
            type: Type.ARRAY,
            description: "A list of 3-5 concrete, actionable suggestions for creating a superior, more comprehensive article that can outrank the competitor.",
            items: { type: Type.STRING }
        },
    },
    required: ["mainTopics", "identifiedKeywords", "suggestions"],
};

const internalLinkSchema = {
    type: Type.OBJECT,
    properties: {
        links: {
            type: Type.ARRAY,
            description: "A list of internal linking opportunities.",
            items: {
                type: Type.OBJECT,
                properties: {
                    anchorText: { type: Type.STRING, description: "The exact phrase from the article body to be used as the link's anchor text." },
                    linkToTitle: { type: Type.STRING, description: "The title of the existing article from the provided list that this anchor text should link to." },
                    reasoning: { type: Type.STRING, description: "A brief explanation of why this internal link is relevant and beneficial for SEO." },
                },
                required: ["anchorText", "linkToTitle", "reasoning"],
            },
        },
    },
    required: ["links"],
};


const extractJsonFromText = (text: string): any => {
    const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = text.match(jsonRegex);
    if (match && match[1]) {
        try {
            return JSON.parse(match[1]);
        } catch (e) {
             console.error("Failed to parse extracted JSON block:", e);
        }
    }
    // Fallback for when the model doesn't use a markdown block
    try {
        return JSON.parse(text);
    } catch (e) {
        console.error("Failed to parse the full response as JSON:", text);
        throw new Error("AI returned a response that could not be parsed as JSON.");
    }
};

export const generateArticle = async (
  topic: string, 
  keywords: string, 
  tone: WritingTone, 
  language: Language,
  articleLength: ArticleLength,
  useGoogleSearch: boolean,
  siteContext?: SiteContext
): Promise<ArticleContent> => {
  const ai = getAiClient();
  const brandVoice = localStorage.getItem(BRAND_VOICE_STORAGE_KEY) || '';
  
  const systemInstruction = `You are an expert SEO content writer and a WordPress specialist. Your goal is to create high-quality, engaging, and well-structured articles that are optimized for search engines. Always follow the instructions precisely and return the content in the specified JSON format.`;

  let contextPrompt = "";
  if (siteContext) {
    contextPrompt = `
For context, here is some information about the website this article will be published on. Use this to ensure the new content is relevant, matches the site's tone, and complements existing content.
- Existing Article Titles: ${siteContext.recentPosts.map(p => `"${p.title}"`).join(", ")}
- Existing Site Categories: ${siteContext.categories.map(c => c.name).join(", ")}
`;
  }

  const userPrompt = `
    Generate a complete article based on the following specifications.
    ${useGoogleSearch ? 'Use your access to Google Search to find up-to-date, factual, and relevant information to write this article.' : ''}
    The output MUST be a single valid JSON object ${useGoogleSearch ? 'enclosed in a ```json markdown block' : 'that strictly matches the provided schema'}. Do not include any text outside of the JSON object.

    **Article Specifications:**
    - Topic/Title Idea: "${topic}"
    - Keywords to include naturally: "${keywords}"
    - Tone of voice: ${tone}
    ${brandVoice ? `- Brand Voice Guidelines: "${brandVoice}"` : ''}
    - Language: ${language}
    - Desired Length: ${articleLength}. Adhere to this length as closely as possible.
    - Structure Requirements: The article 'body' must be written in markdown and have an introduction, an appropriate number of distinct and relevant H2 (##) subheadings for the requested length, and a conclusion.

    ${contextPrompt}

    Now, generate the complete article. The JSON output MUST contain the following keys:
    1. "title": A compelling, SEO-friendly title for the article.
    2. "metaDescription": An SEO-friendly meta description, between 150-160 characters.
    3. "body": The full body of the article, formatted with markdown.
  `;
    
  try {
    const config: any = {
        systemInstruction,
    };
    
    if (useGoogleSearch) {
        config.tools = [{googleSearch: {}}];
    } else {
        config.responseMimeType = "application/json";
        config.responseSchema = articleSchema;
    }

    // FIX: Updated to use modern ai.models.generateContent API
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: userPrompt,
        config: config,
    });

    // FIX: Updated to use modern response.text property
    const jsonText = response.text.trim();
    const parsed = useGoogleSearch ? extractJsonFromText(jsonText) : JSON.parse(jsonText);

    if (!parsed.title || !parsed.metaDescription || !parsed.body) {
        console.error("Invalid JSON structure received:", parsed);
        throw new Error("AI response is missing required fields (title, metaDescription, body).");
    }
    
    return {
      id: `art_${new Date().getTime()}`,
      type: ContentType.Article,
      title: parsed.title,
      metaDescription: parsed.metaDescription,
      body: parsed.body,
      status: 'draft',
      createdAt: new Date(),
    };
  } catch (error) {
    console.error("Error generating article:", error);
    if (error instanceof Error && (error.message.includes("could not be parsed") || error.message.includes("missing required fields"))) {
        throw error;
    }
    throw new Error("Failed to generate article from AI. The model may have returned an invalid response or the service may be temporarily unavailable.");
  }
};


export const generateProduct = async (
  productName: string, 
  features: string, 
  language: Language
): Promise<ProductContent> => {
    const ai = getAiClient();
    const brandVoice = localStorage.getItem(BRAND_VOICE_STORAGE_KEY) || '';

    const prompt = `
        Generate complete product page content for a WooCommerce store. The output MUST be a valid JSON object matching the provided schema.

        - Product Name: "${productName}"
        - Key Features and Specifications: 
          ${features.split('\n').map(f => `- ${f}`).join('\n')}
        - Language: ${language}
        ${brandVoice ? `- Brand Voice Guidelines: "${brandVoice}"` : ''}

        Create compelling copy that persuades customers to buy. Use markdown for formatting in the descriptions.
    `;

  try {
    // FIX: Updated to use modern ai.models.generateContent API
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: productSchema,
        },
    });

    // FIX: Updated to use modern response.text property
    const jsonText = response.text.trim();
    const parsed = JSON.parse(jsonText);

    if (!parsed.title || !parsed.longDescription || !parsed.shortDescription || !parsed.metaDescription) {
        throw new Error("AI response is missing required product fields.");
    }

    return {
      id: `prod_${new Date().getTime()}`,
      type: ContentType.Product,
      title: parsed.title,
      metaDescription: parsed.metaDescription,
      longDescription: parsed.longDescription,
      shortDescription: parsed.shortDescription,
      status: 'draft',
      createdAt: new Date(),
    };
  } catch (error) {
    console.error("Error generating product content:", error);
    throw new Error("Failed to generate product content from AI. The model may have returned an invalid response or the service may be temporarily unavailable.");
  }
};

export const generateFeaturedImage = async (prompt: string): Promise<string[]> => {
    const ai = getAiClient();

    try {
        // FIX: Updated to use modern ai.models.generateImages API with imagen-4.0-generate-001 model
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 4,
                outputMimeType: 'image/jpeg',
                aspectRatio: '16:9',
            },
        });

        if (!response.generatedImages || response.generatedImages.length === 0) {
            throw new Error("AI model did not return any images.");
        }

        return response.generatedImages.map(img => img.image.imageBytes);

    } catch (error) {
        console.error("Error generating featured image:", error);
        throw new Error("Failed to generate image from AI. The service may be temporarily unavailable or the prompt may have been rejected.");
    }
};

export const generateContentStrategy = async (
    topic: string,
    numArticles: number,
    language: Language
): Promise<ArticleContent[]> => {
    const ai = getAiClient();
    const brandVoice = localStorage.getItem(BRAND_VOICE_STORAGE_KEY) || '';
    
    const systemInstruction = `You are an expert content strategist and SEO writer. Your task is to generate a complete content plan for a given topic. You must generate a JSON array containing the specified number of full, ready-to-publish articles. Each article object in the array must conform to the provided schema.`;

    const userPrompt = `
        Generate a content strategy consisting of ${numArticles} full articles on the main topic of "${topic}".
        Each article should be unique, target a different sub-topic or keyword, and be engaging for readers.
        The output MUST be a single, valid JSON array of article objects. Do not include any text outside of the JSON array.
        Each object in the array must strictly adhere to this schema: { title, metaDescription, body }.
        The language for all articles must be ${language}.
        ${brandVoice ? `Adhere to this Brand Voice Guideline for all articles: "${brandVoice}"` : ''}
        The body of each article must be formatted in markdown and be well-structured with an introduction, H2 subheadings, and a conclusion.
    `;

    try {
        // FIX: Updated to use modern ai.models.generateContent API
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: contentStrategySchema,
            },
        });

        // FIX: Updated to use modern response.text property
        const jsonText = response.text.trim();
        const parsedArticles: any[] = JSON.parse(jsonText);

        if (!Array.isArray(parsedArticles)) {
             throw new Error("AI response was not a JSON array.");
        }

        return parsedArticles.map((parsed, index) => {
            if (!parsed.title || !parsed.metaDescription || !parsed.body) {
                console.warn(`Invalid JSON structure for article ${index} in strategy. Skipping.`, parsed);
                return null;
            }
            return {
                id: `art_${new Date().getTime()}_${index}`,
                type: ContentType.Article,
                title: parsed.title,
                metaDescription: parsed.metaDescription,
                body: parsed.body,
                status: 'draft',
                createdAt: new Date(),
            };
        }).filter((article): article is ArticleContent => article !== null);

    } catch (error) {
        console.error("Error generating content strategy:", error);
        throw new Error("Failed to generate content strategy from AI. The model may have returned an invalid format or the service is unavailable.");
    }
};

export const analyzeArticleSeo = async (title: string, body: string): Promise<SeoAnalysis> => {
    const ai = getAiClient();

    const systemInstruction = `You are a world-class SEO expert. Your task is to analyze an article and provide an SEO score and actionable feedback. The response must be a valid JSON object matching the provided schema.`;

    const userPrompt = `
        Please analyze the following article for its Search Engine Optimization (SEO) quality.
        Provide a score out of 100 and a list of specific, actionable suggestions for improvement.

        **Article Title:**
        "${title}"

        **Article Body:**
        ---
        ${body}
        ---

        Evaluate based on factors like:
        - Readability and structure (headings, paragraphs, lists).
        - How well the title reflects the content.
        - Potential for ranking on search engines.
        - Natural integration of potential keywords.

        Return your analysis as a single, valid JSON object.
    `;

    try {
        // FIX: Updated to use modern ai.models.generateContent API
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: seoAnalysisSchema,
            },
        });

        // FIX: Updated to use modern response.text property
        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText) as SeoAnalysis;

        if (typeof parsed.score !== 'number' || !Array.isArray(parsed.suggestions)) {
            throw new Error("AI response is missing required SEO analysis fields.");
        }
        return parsed;

    } catch (error) {
        console.error("Error analyzing SEO:", error);
        throw new Error("Failed to get SEO analysis from AI. The model may have returned an invalid format.");
    }
};

export const analyzeProductSeo = async (title: string, longDescription: string, shortDescription: string): Promise<SeoAnalysis> => {
    const ai = getAiClient();

    const systemInstruction = `You are a world-class e-commerce SEO expert. Your task is to analyze product page content and provide an SEO score and actionable feedback. The response must be a valid JSON object matching the provided schema.`;

    const userPrompt = `
        Please analyze the following product page content for its Search Engine Optimization (SEO) quality.
        Provide a score out of 100 and a list of specific, actionable suggestions for improvement.

        **Product Title:**
        "${title}"

        **Long Description:**
        ---
        ${longDescription}
        ---
        
        **Short Description:**
        ---
        ${shortDescription}
        ---

        Evaluate based on factors like:
        - Persuasiveness and clarity of the descriptions.
        - Natural integration of potential keywords in the title and descriptions.
        - How well the title reflects the product.
        - Overall potential to convert visitors and rank on search engines.

        Return your analysis as a single, valid JSON object.
    `;

    try {
        // FIX: Updated to use modern ai.models.generateContent API
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: seoAnalysisSchema,
            },
        });

        // FIX: Updated to use modern response.text property
        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText) as SeoAnalysis;

        if (typeof parsed.score !== 'number' || !Array.isArray(parsed.suggestions)) {
            throw new Error("AI response is missing required SEO analysis fields.");
        }
        return parsed;

    } catch (error) {
        console.error("Error analyzing product SEO:", error);
        throw new Error("Failed to get product SEO analysis from AI. The model may have returned an invalid format.");
    }
};

export const suggestKeywords = async (topic: string): Promise<KeywordSuggestion[]> => {
    const ai = getAiClient();

    const systemInstruction = `You are an SEO keyword research specialist. Your task is to generate a list of relevant keywords for a given article topic, including estimated search volume and ranking difficulty. The response must be a valid JSON object matching the provided schema.`;

    const userPrompt = `
        Please generate a list of 10-15 highly relevant SEO keywords for an article with the following topic. Include a mix of primary (short-tail) and secondary (long-tail) keywords. For each keyword, provide an estimated search volume and ranking difficulty, categorized as 'Low', 'Medium', or 'High'.

        **Article Topic:**
        "${topic}"

        Return your list as a single, valid JSON object.
    `;

    try {
        // FIX: Updated to use modern ai.models.generateContent API
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: keywordsSchema,
            },
        });

        // FIX: Updated to use modern response.text property
        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);

        if (!parsed.keywords || !Array.isArray(parsed.keywords)) {
            throw new Error("AI response is missing the 'keywords' array.");
        }
        return parsed.keywords;

    } catch (error) {
        console.error("Error suggesting keywords:", error);
        throw new Error("Failed to get keyword suggestions from AI. The model may have returned an invalid format.");
    }
};

export const analyzeCompetitorUrl = async (url: string): Promise<CompetitorAnalysis> => {
    const ai = getAiClient();

    const systemInstruction = `You are a world-class SEO and content strategist. Your task is to analyze a competitor's article from a given URL and provide a structured analysis for creating a better piece of content. The response must be a valid JSON object enclosed in a \`\`\`json markdown block.`;
    const userPrompt = `
        Use Google Search to find and thoroughly analyze the content at the following URL: ${url}

        Based on your analysis, provide a content strategy to create a superior article that can outrank it. Your analysis must be returned as a single, valid JSON object with the following keys:
        1. "mainTopics": A list of the main topics and themes covered in the competitor's article.
        2. "identifiedKeywords": A list of the primary and secondary keywords the competitor's article seems to be targeting.
        3. "suggestions": A list of 3-5 concrete, actionable suggestions for creating a better, more comprehensive article. These suggestions should highlight content gaps, suggest additional sub-topics, or recommend different angles to take.
    `;

    try {
        // FIX: Updated to use modern ai.models.generateContent API with googleSearch tool
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: {
                systemInstruction,
                tools: [{ googleSearch: {} }],
            },
        });

        // FIX: Updated to use modern response.text property
        const jsonText = response.text.trim();
        const parsed = extractJsonFromText(jsonText) as CompetitorAnalysis;

        if (!parsed.mainTopics || !parsed.identifiedKeywords || !parsed.suggestions) {
             throw new Error("AI response is missing required competitor analysis fields.");
        }
        return parsed;

    } catch (error) {
        console.error("Error analyzing competitor URL:", error);
        throw new Error("Failed to get competitor analysis from AI. The model may have returned an invalid format or the service is unavailable.");
    }
};

export const suggestInternalLinks = async (articleBody: string, libraryTitles: string[]): Promise<InternalLinkSuggestion[]> => {
    const ai = getAiClient();
    
    const systemInstruction = `You are an on-page SEO expert specializing in internal linking strategy. Your task is to analyze an article and identify opportunities to link to other existing articles on the same site. Your response must be a valid JSON object matching the provided schema.`;
    const userPrompt = `
        I have an article with the following body text. I also have a list of other article titles from my website.

        **Article Body to Analyze:**
        ---
        ${articleBody.substring(0, 4000)} 
        ---

        **List of Existing Article Titles to Link To:**
        - ${libraryTitles.join('\n- ')}

        Please analyze the article body and identify 3-5 of the best opportunities for internal links. For each opportunity, provide the exact anchor text from the body, the title of the article it should link to from the list, and a brief justification for why it's a good link.

        Return your suggestions as a single, valid JSON object.
    `;

    try {
        // FIX: Updated to use modern ai.models.generateContent API
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: internalLinkSchema,
            },
        });

        // FIX: Updated to use modern response.text property
        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);
        
        if (!parsed.links || !Array.isArray(parsed.links)) {
            throw new Error("AI response is missing the 'links' array.");
        }
        return parsed.links;

    } catch (error) {
        console.error("Error suggesting internal links:", error);
        throw new Error("Failed to get internal link suggestions from AI.");
    }
};

// This file was created to provide the UI for generating new content.
import React, { useState, useContext, useEffect } from 'react';
import { LanguageContext } from '../App';
import { LanguageContextType, WordPressSite, WritingTone, ArticleLength, ContentType, ArticleContent, ProductContent, GeneratedContent, Notification } from '../types';
import { generateArticle, generateProduct, generateContentStrategy, generateFeaturedImage } from '../services/geminiService';
import Spinner from './common/Spinner';
import RichTextEditor from './RichTextEditor';

interface NewContentViewProps {
    onContentGenerated: (content: GeneratedContent | GeneratedContent[]) => void;
    existingContent: GeneratedContent | null;
    onClearEditing: () => void;
    onUpdateLibraryItem: (id: string, updates: Partial<GeneratedContent>) => void;
    sites: WordPressSite[];
    showNotification: (notification: Notification) => void;
}

const NewContentView: React.FC<NewContentViewProps> = ({ onContentGenerated, existingContent, onClearEditing, onUpdateLibraryItem }) => {
    const { t, language } = useContext(LanguageContext as React.Context<LanguageContextType>);
    const [activeTab, setActiveTab] = useState<'article' | 'product' | 'strategy' | 'image'>('article');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedContent, setGeneratedContent] = useState<GeneratedContent | GeneratedContent[] | null>(null);

    // Article State
    const [articleTopic, setArticleTopic] = useState('');
    const [articleKeywords, setArticleKeywords] = useState('');
    const [writingTone, setWritingTone] = useState<WritingTone>('Professional');
    const [articleLength, setArticleLength] = useState<ArticleLength>('Medium (~1000 words)');
    const [useGoogleSearch, setUseGoogleSearch] = useState(false);

    // Product State
    const [productName, setProductName] = useState('');
    const [productFeatures, setProductFeatures] = useState('');

    // Strategy State
    const [strategyTopic, setStrategyTopic] = useState('');
    const [strategyNumArticles, setStrategyNumArticles] = useState(3);

    // Image State
    const [imagePrompt, setImagePrompt] = useState('');
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    const [isGeneratingImages, setIsGeneratingImages] = useState(false);

    useEffect(() => {
        if (existingContent) {
            if (existingContent.type === ContentType.Article) {
                setActiveTab('article');
                setGeneratedContent(existingContent);
                setArticleTopic(existingContent.title);
            } else if (existingContent.type === ContentType.Product) {
                setActiveTab('product');
                setGeneratedContent(existingContent);
                setProductName(existingContent.title);
            }
        }
        return () => {
            onClearEditing();
        };
    }, [existingContent, onClearEditing]);


    const handleGenerateArticle = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsGenerating(true);
        setGeneratedContent(null);
        try {
            const result = await generateArticle(articleTopic, articleKeywords, writingTone, language, articleLength, useGoogleSearch);
            setGeneratedContent(result);
        } catch (error) {
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleGenerateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsGenerating(true);
        setGeneratedContent(null);
        try {
            const result = await generateProduct(productName, productFeatures, language);
            setGeneratedContent(result);
        } catch (error) {
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleGenerateStrategy = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsGenerating(true);
        setGeneratedContent(null);
        try {
            const results = await generateContentStrategy(strategyTopic, strategyNumArticles, language);
            setGeneratedContent(results);
        } catch (error) {
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleGenerateImage = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsGeneratingImages(true);
        setGeneratedImages([]);
        try {
            const results = await generateFeaturedImage(imagePrompt);
            setGeneratedImages(results);
        } catch (error) {
            console.error(error);
        } finally {
            setIsGeneratingImages(false);
        }
    };
    
    const handleAddToLibrary = () => {
        if (generatedContent) {
            if (existingContent) {
                 // It's an update
                 const contentToUpdate = Array.isArray(generatedContent) ? generatedContent[0] : generatedContent;
                 onUpdateLibraryItem(contentToUpdate.id, contentToUpdate);
            } else {
                 onContentGenerated(generatedContent);
            }
            setGeneratedContent(null);
            // Reset forms
            setArticleTopic('');
            setArticleKeywords('');
            setProductName('');
            setProductFeatures('');
            setStrategyTopic('');
        }
    };
    
    const renderArticleForm = () => (
        <form onSubmit={handleGenerateArticle} className="space-y-4">
            <input type="text" placeholder={t('articleTopicPlaceholder')} value={articleTopic} onChange={e => setArticleTopic(e.target.value)} required className="w-full bg-gray-700 text-white rounded-md p-3" />
            <input type="text" placeholder={t('keywordsPlaceholder')} value={articleKeywords} onChange={e => setArticleKeywords(e.target.value)} required className="w-full bg-gray-700 text-white rounded-md p-3" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select value={writingTone} onChange={e => setWritingTone(e.target.value as WritingTone)} className="w-full bg-gray-700 text-white rounded-md p-3">
                    <option>Professional</option>
                    <option>Casual</option>
                    <option>Enthusiastic</option>
                    <option>Informative</option>
                    <option>Humorous</option>
                </select>
                <select value={articleLength} onChange={e => setArticleLength(e.target.value as ArticleLength)} className="w-full bg-gray-700 text-white rounded-md p-3">
                    <option>Short (~500 words)</option>
                    <option>Medium (~1000 words)</option>
                    <option>Long (~2000 words)</option>
                </select>
            </div>
             <div className="flex items-center">
                <input type="checkbox" id="google-search" checked={useGoogleSearch} onChange={e => setUseGoogleSearch(e.target.checked)} className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500" />
                <label htmlFor="google-search" className="ms-2 text-sm text-gray-300">{t('useGoogleSearch')}</label>
            </div>
            <button type="submit" disabled={isGenerating} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md flex items-center justify-center disabled:bg-blue-800">
                {isGenerating ? <Spinner size="sm" /> : (existingContent ? t('regenerate') : t('generate'))}
            </button>
        </form>
    );
    
    const renderProductForm = () => (
         <form onSubmit={handleGenerateProduct} className="space-y-4">
            <input type="text" placeholder={t('productNamePlaceholder')} value={productName} onChange={e => setProductName(e.target.value)} required className="w-full bg-gray-700 text-white rounded-md p-3" />
            <textarea placeholder={t('productFeaturesPlaceholder')} value={productFeatures} onChange={e => setProductFeatures(e.target.value)} required rows={5} className="w-full bg-gray-700 text-white rounded-md p-3" />
             <button type="submit" disabled={isGenerating} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md flex items-center justify-center disabled:bg-blue-800">
                {isGenerating ? <Spinner size="sm" /> : (existingContent ? t('regenerate') : t('generate'))}
            </button>
        </form>
    );

    const renderStrategyForm = () => (
         <form onSubmit={handleGenerateStrategy} className="space-y-4">
            <input type="text" placeholder={t('strategyTopicPlaceholder')} value={strategyTopic} onChange={e => setStrategyTopic(e.target.value)} required className="w-full bg-gray-700 text-white rounded-md p-3" />
            <div>
                <label className="text-sm text-gray-400 mb-2 block">{t('numberOfArticles')}</label>
                <input type="number" value={strategyNumArticles} onChange={e => setStrategyNumArticles(parseInt(e.target.value, 10))} min="2" max="10" className="w-full bg-gray-700 text-white rounded-md p-3" />
            </div>
            <button type="submit" disabled={isGenerating} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md flex items-center justify-center disabled:bg-blue-800">
                {isGenerating ? <Spinner size="sm" /> : t('generateStrategy')}
            </button>
        </form>
    );
    
    const renderImageForm = () => (
        <form onSubmit={handleGenerateImage} className="space-y-4">
            <textarea placeholder={t('imagePromptPlaceholder')} value={imagePrompt} onChange={e => setImagePrompt(e.target.value)} required rows={3} className="w-full bg-gray-700 text-white rounded-md p-3" />
             <button type="submit" disabled={isGeneratingImages} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md flex items-center justify-center disabled:bg-blue-800">
                {isGeneratingImages ? <Spinner size="sm" /> : t('generateImages')}
            </button>
        </form>
    );

    const renderGeneratedContent = () => {
        if (!generatedContent) return null;

        if (Array.isArray(generatedContent)) {
            // Content Strategy View
            return (
                <div className="space-y-4">
                    {generatedContent.map((item, index) => (
                        <div key={item.id} className="bg-gray-800 p-4 rounded-lg">
                           <h3 className="text-lg font-semibold text-white">{index + 1}. {item.title}</h3>
                           <p className="text-sm text-gray-400 mt-1">{item.metaDescription}</p>
                        </div>
                    ))}
                </div>
            )
        }

        if (generatedContent.type === ContentType.Article) {
            const content = generatedContent as ArticleContent;
            return (
                <div className="space-y-4">
                    <input type="text" value={content.title} onChange={(e) => setGeneratedContent({...content, title: e.target.value})} className="w-full bg-gray-900 text-2xl font-bold text-white rounded-md p-2" />
                    <textarea value={content.metaDescription} onChange={(e) => setGeneratedContent({...content, metaDescription: e.target.value})} className="w-full bg-gray-900 text-sm text-gray-300 rounded-md p-2" rows={3}/>
                    <RichTextEditor id="article-body" value={content.body} onChange={(newValue) => setGeneratedContent({...content, body: newValue})} className="w-full bg-gray-900 text-white rounded-md p-3 min-h-[50vh]" />
                </div>
            )
        }
        
        if (generatedContent.type === ContentType.Product) {
            const content = generatedContent as ProductContent;
            return (
                <div className="space-y-4">
                     <input type="text" value={content.title} onChange={(e) => setGeneratedContent({...content, title: e.target.value})} className="w-full bg-gray-900 text-2xl font-bold text-white rounded-md p-2" />
                    <h3 className="text-lg font-semibold text-gray-300 border-b border-gray-600 pb-2">{t('shortDescription')}</h3>
                    <RichTextEditor id="product-short-desc" value={content.shortDescription} onChange={(newValue) => setGeneratedContent({...content, shortDescription: newValue})} rows={4} className="w-full bg-gray-900 text-white rounded-md p-3" />
                    <h3 className="text-lg font-semibold text-gray-300 border-b border-gray-600 pb-2">{t('longDescription')}</h3>
                     <RichTextEditor id="product-long-desc" value={content.longDescription} onChange={(newValue) => setGeneratedContent({...content, longDescription: newValue})} className="w-full bg-gray-900 text-white rounded-md p-3 min-h-[40vh]" />
                </div>
            )
        }
    };

    const renderGeneratedImages = () => (
        <div className="grid grid-cols-2 gap-4">
            {generatedImages.map((base64, index) => (
                <img key={index} src={`data:image/jpeg;base64,${base64}`} alt={`Generated image ${index + 1}`} className="rounded-lg"/>
            ))}
        </div>
    );
    
    const tabs = [
        { id: 'article', label: t('generateArticle') },
        { id: 'product', label: t('generateProduct') },
        { id: 'strategy', label: t('contentStrategy') },
        { id: 'image', label: t('generateImage') },
    ];
    
    return (
        <div className="p-8 h-full flex flex-col text-white">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">{existingContent ? t('editContent') : t('createNewContent')}</h1>
            </header>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-grow">
                {/* Left Panel: Form */}
                <div className="bg-gray-800 p-6 rounded-lg flex flex-col">
                    <div className="flex border-b border-gray-700 mb-6">
                        {tabs.map(tab => (
                             <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`py-2 px-4 text-sm font-medium ${activeTab === tab.id ? 'border-b-2 border-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    {activeTab === 'article' && renderArticleForm()}
                    {activeTab === 'product' && renderProductForm()}
                    {activeTab === 'strategy' && renderStrategyForm()}
                    {activeTab === 'image' && renderImageForm()}
                </div>

                {/* Right Panel: Output */}
                <div className="bg-gray-800 p-6 rounded-lg overflow-y-auto">
                    {isGenerating ? (
                        <div className="flex justify-center items-center h-full"><Spinner /></div>
                    ) : (
                        <>
                            {generatedContent && (
                                <>
                                    {renderGeneratedContent()}
                                    <button onClick={handleAddToLibrary} className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-md">
                                        {existingContent ? t('saveChanges') : t('addToLibrary')}
                                    </button>
                                </>
                            )}
                            {isGeneratingImages ? <div className="flex justify-center items-center h-full"><Spinner /></div> : renderGeneratedImages()}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NewContentView;

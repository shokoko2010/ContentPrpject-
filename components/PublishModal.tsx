// components/PublishModal.tsx

import React, { useState, useContext, useEffect, useMemo } from 'react';
import Modal from './common/Modal';
import { GeneratedContent, WordPressSite, PublishingOptions, LanguageContextType, WordPressCategory, WordPressPost, ContentType } from '../types';
import { LanguageContext } from '../App';
import Spinner from './common/Spinner';
import { getSiteCategories, getSitePosts } from '../services/wordpressService';

interface PublishModalProps {
    content: GeneratedContent;
    sites: WordPressSite[];
    isOpen: boolean;
    onClose: () => void;
    onPublish: (options: PublishingOptions) => void;
    isPublishing: boolean;
}

const PublishModal: React.FC<PublishModalProps> = ({ content, sites, isOpen, onClose, onPublish, isPublishing }) => {
    const { t } = useContext(LanguageContext as React.Context<LanguageContextType>);
    const availableSites = useMemo(() => sites.filter(s => !s.isVirtual), [sites]);
    
    const [selectedSiteId, setSelectedSiteId] = useState<string>(content.siteId && availableSites.some(s => s.id === content.siteId) ? content.siteId : availableSites[0]?.id || '');
    const [status, setStatus] = useState<'publish' | 'draft' | 'pending'>('publish');
    const [action, setAction] = useState<'create' | 'update'>('create');
    const [selectedPostId, setSelectedPostId] = useState<number | undefined>(content.wordpressId);
    
    const [categories, setCategories] = useState<WordPressCategory[]>([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState<Set<number>>(new Set());
    
    const [posts, setPosts] = useState<WordPressPost[]>([]);
    const [isLoadingPosts, setIsLoadingPosts] = useState(false);
    
    const selectedSite = useMemo(() => sites.find(s => s.id === selectedSiteId), [sites, selectedSiteId]);

    useEffect(() => {
        if (isOpen && selectedSite) {
            setAction(content.wordpressId ? 'update' : 'create');
            setSelectedPostId(content.wordpressId);
            
            // Fetch Categories
            setIsLoadingCategories(true);
            getSiteCategories(selectedSite)
                .then(setCategories)
                .catch(() => setCategories([]))
                .finally(() => setIsLoadingCategories(false));

            // Fetch Posts if updating
            if (action === 'update') {
                setIsLoadingPosts(true);
                getSitePosts(selectedSite, content.type === ContentType.Article ? 'post' : 'product')
                    .then(setPosts)
                    .catch(() => setPosts([]))
                    .finally(() => setIsLoadingPosts(false));
            }
        } else if (!isOpen) {
             // Reset state on close
             setSelectedCategories(new Set());
        }
    }, [isOpen, selectedSite, content]);
    
    useEffect(() => {
        // If user switches to 'update' action, fetch posts
        if (isOpen && selectedSite && action === 'update' && posts.length === 0) {
            setIsLoadingPosts(true);
            getSitePosts(selectedSite, content.type === ContentType.Article ? 'post' : 'product')
                .then(fetchedPosts => {
                    setPosts(fetchedPosts);
                    // If the content already has a wordpressId, ensure it's selected
                    if(content.wordpressId && fetchedPosts.some(p => p.id === content.wordpressId)) {
                        setSelectedPostId(content.wordpressId);
                    } else {
                        setSelectedPostId(fetchedPosts[0]?.id);
                    }
                })
                .catch(() => setPosts([]))
                .finally(() => setIsLoadingPosts(false));
        }
    }, [action, isOpen, selectedSite, content]);


    const handleCategoryToggle = (categoryId: number) => {
        setSelectedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(categoryId)) {
                newSet.delete(categoryId);
            } else {
                newSet.add(categoryId);
            }
            return newSet;
        });
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSiteId || (action === 'update' && !selectedPostId)) {
            return;
        }
        onPublish({
            siteId: selectedSiteId,
            status,
            action,
            postId: action === 'update' ? selectedPostId : undefined,
            categories: Array.from(selectedCategories),
        });
    };

    if (!isOpen) return null;

    return (
        <Modal title={t('publishToWordPress')} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Site Selection */}
                <div>
                    <label htmlFor="publish-site" className="block text-sm font-medium text-gray-300">{t('publishToSite')}</label>
                    <select id="publish-site" value={selectedSiteId} onChange={(e) => setSelectedSiteId(e.target.value)} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white" disabled={isPublishing}>
                        {availableSites.length > 0 ? availableSites.map(site => <option key={site.id} value={site.id}>{site.name}</option>) : <option disabled>{t('noConnectedSites')}</option>}
                    </select>
                </div>
                
                {/* Action Selection */}
                <div className="flex space-x-4 rtl:space-x-reverse border border-gray-600 rounded-md p-1 bg-gray-900">
                    <button type="button" onClick={() => setAction('create')} disabled={isPublishing} className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${action === 'create' ? 'bg-blue-600 text-white font-semibold' : 'hover:bg-gray-700 text-gray-300'}`}>{t('publishAsNew')}</button>
                    <button type="button" onClick={() => setAction('update')} disabled={isPublishing} className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${action === 'update' ? 'bg-blue-600 text-white font-semibold' : 'hover:bg-gray-700 text-gray-300'}`}>{t('updateExisting')}</button>
                </div>

                {/* Update Existing Post Dropdown */}
                {action === 'update' && (
                    <div>
                        <label htmlFor="update-post" className="block text-sm font-medium text-gray-300">{t('selectPostToUpdate')}</label>
                        {isLoadingPosts ? <div className="h-10 flex items-center"><Spinner size="sm"/></div> : (
                            <select id="update-post" value={selectedPostId} onChange={(e) => setSelectedPostId(Number(e.target.value))} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white" disabled={isPublishing || posts.length === 0}>
                                {posts.length > 0 ? posts.map(post => <option key={post.id} value={post.id}>{post.title}</option>) : <option disabled>{t('noPostsFound')}</option>}
                            </select>
                        )}
                    </div>
                )}
                
                {/* Categories */}
                <div>
                     <label className="block text-sm font-medium text-gray-300">{t('categories')}</label>
                     {isLoadingCategories ? <div className="h-10 flex items-center"><Spinner size="sm"/></div> : (
                        categories.length > 0 ? (
                             <div className="mt-2 max-h-32 overflow-y-auto space-y-2 p-3 bg-gray-900/50 rounded-md border border-gray-600">
                                {categories.map(cat => (
                                    <label key={cat.id} className="flex items-center text-sm text-gray-200 cursor-pointer">
                                        <input type="checkbox" checked={selectedCategories.has(cat.id)} onChange={() => handleCategoryToggle(cat.id)} disabled={isPublishing} className="h-4 w-4 rounded border-gray-500 text-blue-600 focus:ring-blue-500 bg-gray-700" />
                                        <span className="ms-2">{cat.name} <span className="text-gray-500 text-xs">({cat.count})</span></span>
                                    </label>
                                ))}
                            </div>
                        ) : <p className="text-sm text-gray-500 mt-1">{t('noCategoriesFound')}</p>
                     )}
                </div>

                {/* Status */}
                <div>
                    <label htmlFor="publish-status" className="block text-sm font-medium text-gray-300">{t('status')}</label>
                     <select id="publish-status" value={status} onChange={(e) => setStatus(e.target.value as any)} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white" disabled={isPublishing}>
                        <option value="publish">{t('publishStatus')}</option>
                        <option value="draft">{t('draftStatus')}</option>
                        <option value="pending">{t('pendingStatus')}</option>
                    </select>
                </div>

                {/* Actions */}
                <div className="pt-4 flex justify-end space-x-3 rtl:space-x-reverse">
                    <button type="button" onClick={onClose} disabled={isPublishing} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50">{t('cancel')}</button>
                    <button type="submit" disabled={isPublishing || availableSites.length === 0 || (action === 'update' && !selectedPostId)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-colors flex items-center justify-center disabled:bg-green-800 disabled:cursor-not-allowed">
                        {isPublishing ? <Spinner size="sm" /> : (action === 'update' ? t('update') : t('publish'))}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default PublishModal;

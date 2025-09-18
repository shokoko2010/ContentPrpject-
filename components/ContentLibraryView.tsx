// This file was created to display and manage the library of generated content.
import React, { useState, useMemo, useContext } from 'react';
import { GeneratedContent, WordPressSite, ContentType, Notification, LanguageContextType, PublishingOptions } from '../types';
import { LanguageContext } from '../App';
import PublishModal from './PublishModal';
import { publishContent } from '../services/wordpressService';
import BulkScheduleModal from './BulkScheduleModal';

interface ContentLibraryViewProps {
    library: GeneratedContent[];
    onUpdateItem: (id: string, updates: Partial<GeneratedContent>) => void;
    onRemoveItem: (id: string) => void;
    onEditItem: (content: GeneratedContent) => void;
    sites: WordPressSite[];
    showNotification: (notification: Notification) => void;
}

const ContentLibraryView: React.FC<ContentLibraryViewProps> = ({ library, onUpdateItem, onRemoveItem, onEditItem, sites, showNotification }) => {
    const { t } = useContext(LanguageContext as React.Context<LanguageContextType>);
    const [filter, setFilter] = useState<'all' | 'article' | 'product'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [contentToPublish, setContentToPublish] = useState<GeneratedContent | null>(null);
    const [isPublishing, setIsPublishing] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

    const filteredLibrary = useMemo(() => {
        return library
            .filter(item => filter === 'all' || item.type === filter)
            .filter(item => item.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [library, filter, searchTerm]);

    const handlePublishClick = (content: GeneratedContent) => {
        setContentToPublish(content);
        setIsPublishModalOpen(true);
    };

    const handlePublish = async (options: PublishingOptions) => {
        if (!contentToPublish) return;
        setIsPublishing(true);
        try {
            const site = sites.find(s => s.id === options.siteId);
            if (!site) throw new Error("Selected site not found");

            const { postUrl, postId } = await publishContent(site, contentToPublish, options);
            
            onUpdateItem(contentToPublish.id, { 
                status: 'published',
                siteId: site.id,
                wordpressId: postId,
                wordpressUrl: postUrl
            });

            showNotification({ message: t('publishSuccess'), type: 'success' });
            setIsPublishModalOpen(false);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : t('errorUnknown');
            showNotification({ message: t('publishFail', { error: errorMessage }), type: 'error' });
        } finally {
            setIsPublishing(false);
        }
    };
    
    const handleSelectItem = (id: string) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };
    
    const handleSelectAll = () => {
        if (selectedItems.size === filteredLibrary.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(filteredLibrary.map(item => item.id)));
        }
    };
    
    const handleBulkSchedule = (startDate: string, intervalDays: number) => {
        const selectedIds = Array.from(selectedItems);
        let currentScheduleDate = new Date(startDate);

        selectedIds.forEach(id => {
            onUpdateItem(id, {
                status: 'scheduled',
                scheduledFor: currentScheduleDate.toISOString()
            });
            // Add interval days for the next item
            currentScheduleDate.setDate(currentScheduleDate.getDate() + intervalDays);
        });

        showNotification({ message: t('bulkScheduleSuccess', { count: selectedIds.length }), type: 'success' });
        setSelectedItems(new Set());
        setIsScheduleModalOpen(false);
    };


    return (
        <div className="p-8 h-full text-white">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">{t('libraryTitle')}</h1>
                <div>
                     {selectedItems.size > 0 && (
                        <button onClick={() => setIsScheduleModalOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md transition-colors me-2">
                           {t('bulkSchedule')} ({selectedItems.size})
                        </button>
                    )}
                </div>
            </header>

            <div className="flex justify-between items-center mb-4 bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                    <button onClick={() => setFilter('all')} className={`px-3 py-1 text-sm rounded-md ${filter === 'all' ? 'bg-blue-600' : 'bg-gray-700'}`}>{t('all')}</button>
                    <button onClick={() => setFilter('article')} className={`px-3 py-1 text-sm rounded-md ${filter === 'article' ? 'bg-blue-600' : 'bg-gray-700'}`}>{t('articles')}</button>
                    <button onClick={() => setFilter('product')} className={`px-3 py-1 text-sm rounded-md ${filter === 'product' ? 'bg-blue-600' : 'bg-gray-700'}`}>{t('products')}</button>
                </div>
                <input type="text" placeholder={t('searchLibrary')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-gray-700 text-white rounded-md px-4 py-2 w-1/3"/>
            </div>

            <div className="bg-gray-800 rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                        <tr>
                             <th scope="col" className="p-4">
                                <input type="checkbox" onChange={handleSelectAll} checked={selectedItems.size > 0 && selectedItems.size === filteredLibrary.length} className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-600 ring-offset-gray-800 focus:ring-2"/>
                            </th>
                            <th scope="col" className="px-6 py-3">{t('title')}</th>
                            <th scope="col" className="px-6 py-3">{t('type')}</th>
                            <th scope="col" className="px-6 py-3">{t('status')}</th>
                            <th scope="col" className="px-6 py-3">{t('createdAt')}</th>
                            <th scope="col" className="px-6 py-3">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLibrary.map(item => (
                            <tr key={item.id} className="border-b border-gray-700 hover:bg-gray-600/50">
                                <td className="w-4 p-4">
                                    <input type="checkbox" checked={selectedItems.has(item.id)} onChange={() => handleSelectItem(item.id)} className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-600 ring-offset-gray-800 focus:ring-2"/>
                                </td>
                                <th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap">{item.title}</th>
                                <td className="px-6 py-4">{item.type === ContentType.Article ? t('article') : t('product')}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                        item.status === 'published' ? 'bg-green-900 text-green-300' :
                                        item.status === 'scheduled' ? 'bg-yellow-900 text-yellow-300' :
                                        'bg-gray-600 text-gray-300'
                                    }`}>{t(item.status)}</span>
                                </td>
                                <td className="px-6 py-4">{new Date(item.createdAt).toLocaleDateString()}</td>
                                <td className="px-6 py-4 space-x-2 rtl:space-x-reverse whitespace-nowrap">
                                    <button onClick={() => onEditItem(item)} className="font-medium text-blue-400 hover:underline">{t('edit')}</button>
                                    <button onClick={() => handlePublishClick(item)} className="font-medium text-green-400 hover:underline" disabled={item.status === 'published'}>{t('publish')}</button>
                                    <button onClick={() => onRemoveItem(item.id)} className="font-medium text-red-400 hover:underline">{t('delete')}</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredLibrary.length === 0 && (
                    <div className="text-center py-16">
                        <p className="text-gray-400">{t('noContentFound')}</p>
                    </div>
                )}
            </div>
            {contentToPublish && (
                <PublishModal
                    content={contentToPublish}
                    sites={sites}
                    isOpen={isPublishModalOpen}
                    onClose={() => setIsPublishModalOpen(false)}
                    onPublish={handlePublish}
                    isPublishing={isPublishing}
                />
            )}
            <BulkScheduleModal
                isOpen={isScheduleModalOpen}
                onClose={() => setIsScheduleModalOpen(false)}
                onConfirm={handleBulkSchedule}
                itemCount={selectedItems.size}
            />
        </div>
    );
};

export default ContentLibraryView;

// This file was created to display and manage the library of generated content.
import React, { useState, useMemo, useContext } from 'react';
import { GeneratedContent, WordPressSite, ContentType, Notification, LanguageContextType, PublishingOptions, ContentStatus, User, UserRole } from '../types';
import { LanguageContext } from '../App';
import PublishModal from './PublishModal';
import { publishContent } from '../services/wordpressService';
import BulkScheduleModal from './BulkScheduleModal';
import { USERS } from '../services/backendService';

interface ContentLibraryViewProps {
    library: GeneratedContent[];
    onUpdateItem: (id: string, updates: Partial<GeneratedContent>) => void;
    onRemoveItem: (id: string) => void;
    onEditItem: (content: GeneratedContent) => void;
    sites: WordPressSite[];
    showNotification: (notification: Notification) => void;
    currentUser: User;
}

const statusColors: { [key in ContentStatus]: string } = {
    draft: 'bg-gray-600 text-gray-300',
    'needs-review': 'bg-yellow-800 text-yellow-200',
    approved: 'bg-blue-800 text-blue-200',
    scheduled: 'bg-purple-800 text-purple-200',
    published: 'bg-green-800 text-green-200',
};

const ContentLibraryView: React.FC<ContentLibraryViewProps> = ({ library, onUpdateItem, onRemoveItem, onEditItem, sites, showNotification, currentUser }) => {
    const { t } = useContext(LanguageContext as React.Context<LanguageContextType>);
    const [typeFilter, setTypeFilter] = useState<'all' | 'article' | 'product'>('all');
    const [statusFilter, setStatusFilter] = useState<ContentStatus | 'all'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [contentToPublish, setContentToPublish] = useState<GeneratedContent | null>(null);
    const [isPublishing, setIsPublishing] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

    const userIsEditor = currentUser.role === UserRole.Editor;

    const getAuthorEmail = (authorId?: string) => {
        if (!authorId) return t('authorUnknown');
        const author = USERS.find(user => user.id === authorId);
        return author ? author.email : t('authorUnknown');
    };

    const filteredLibrary = useMemo(() => {
        return library
            .filter(item => typeFilter === 'all' || item.type === typeFilter)
            .filter(item => statusFilter === 'all' || item.status === statusFilter)
            .filter(item => 
                item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                getAuthorEmail(item.authorId).toLowerCase().includes(searchTerm.toLowerCase())
            );
    }, [library, typeFilter, statusFilter, searchTerm]);

    const handlePublishClick = (content: GeneratedContent) => {
        if (!userIsEditor) return;
        setContentToPublish(content);
        setIsPublishModalOpen(true);
    };
    
    const handleStatusChange = (id: string, status: ContentStatus) => {
        onUpdateItem(id, { status });
    };

    const handlePublish = async (options: PublishingOptions) => {
        if (!contentToPublish || !userIsEditor) return;
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
        if (!userIsEditor) return;
        const selectedIds = Array.from(selectedItems);
        let currentScheduleDate = new Date(startDate);

        selectedIds.forEach(id => {
            const item = library.find(i => i.id === id);
            if (item && item.status === 'approved') {
                 onUpdateItem(id, {
                    status: 'scheduled',
                    scheduledFor: currentScheduleDate.toISOString()
                });
                currentScheduleDate.setDate(currentScheduleDate.getDate() + intervalDays);
            }
        });

        showNotification({ message: t('bulkScheduleSuccess', { count: selectedIds.length }), type: 'success' });
        setSelectedItems(new Set());
        setIsScheduleModalOpen(false);
    };

    const renderWorkflowActions = (item: GeneratedContent) => {
        if (userIsEditor) {
            switch (item.status) {
                case 'needs-review':
                    return (
                        <>
                            <button onClick={() => handleStatusChange(item.id, 'approved')} className="font-medium text-green-400 hover:underline me-2">{t('approve')}</button>
                            <button onClick={() => handleStatusChange(item.id, 'draft')} className="font-medium text-red-400 hover:underline">{t('reject')}</button>
                        </>
                    );
                case 'approved':
                    return <button onClick={() => handlePublishClick(item)} className="font-medium text-cyan-400 hover:underline">{t('publish')}</button>;
                default:
                    return null;
            }
        } else { // User is a Writer
            if (item.status === 'draft' && item.authorId === currentUser.id) {
                return <button onClick={() => handleStatusChange(item.id, 'needs-review')} className="font-medium text-yellow-400 hover:underline">{t('submitForReview')}</button>;
            }
            return null;
        }
    };

    const canEditOrDelete = (item: GeneratedContent) => {
        if (userIsEditor) return true;
        return item.authorId === currentUser.id && item.status === 'draft';
    }


    return (
        <div className="p-8 h-full text-white">
            <header className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">{t('libraryTitle')}</h1>
                 <div>
                     {userIsEditor && selectedItems.size > 0 && (
                        <button onClick={() => setIsScheduleModalOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md transition-colors me-2">
                           {t('bulkSchedule')} ({selectedItems.size})
                        </button>
                    )}
                </div>
            </header>

            <div className="bg-gray-800 p-4 rounded-lg mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="text-xs text-gray-400">{t('type')}</label>
                        <div className="flex items-center space-x-2 mt-1">
                            <button onClick={() => setTypeFilter('all')} className={`px-3 py-1 text-sm rounded-md w-full ${typeFilter === 'all' ? 'bg-blue-600' : 'bg-gray-700'}`}>{t('all')}</button>
                            <button onClick={() => setTypeFilter('article')} className={`px-3 py-1 text-sm rounded-md w-full ${typeFilter === 'article' ? 'bg-blue-600' : 'bg-gray-700'}`}>{t('articles')}</button>
                            <button onClick={() => setTypeFilter('product')} className={`px-3 py-1 text-sm rounded-md w-full ${typeFilter === 'product' ? 'bg-blue-600' : 'bg-gray-700'}`}>{t('products')}</button>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-gray-400">{t('status')}</label>
                        <select onChange={(e) => setStatusFilter(e.target.value as ContentStatus | 'all')} value={statusFilter} className="bg-gray-700 text-white rounded-md px-4 py-2 w-full mt-1 border-gray-600 focus:ring-blue-500 focus:border-blue-500">
                            <option value="all">{t('all')}</option>
                            <option value="draft">{t('draft')}</option>
                            <option value="needs-review">{t('needsReview')}</option>
                            <option value="approved">{t('approved')}</option>
                            <option value="scheduled">{t('scheduled')}</option>
                            <option value="published">{t('published')}</option>
                        </select>
                    </div>
                    <div>
                         <label className="text-xs text-gray-400">{t('searchLibrary')}</label>
                        <input type="text" placeholder={t('searchByTitleOrAuthor')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-gray-700 text-white rounded-md px-4 py-2 w-full mt-1 border-gray-600 focus:ring-blue-500 focus:border-blue-500"/>
                    </div>
                </div>
            </div>

            <div className="bg-gray-800 rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                        <tr>
                             <th scope="col" className="p-4">
                                <input type="checkbox" onChange={handleSelectAll} checked={selectedItems.size > 0 && selectedItems.size === filteredLibrary.length && filteredLibrary.length > 0} className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-600 ring-offset-gray-800 focus:ring-2"/>
                            </th>
                            <th scope="col" className="px-6 py-3">{t('title')}</th>
                            <th scope="col" className="px-6 py-3">{t('author')}</th>
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
                                    <input type="checkbox" checked={selectedItems.has(item.id)} onChange={() => handleSelectItem(item.id)} className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-600 ring-offset-gray-800 focus:ring-2" disabled={!userIsEditor && item.status !== 'approved'}/>
                                </td>
                                <th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap">{item.title}</th>
                                <td className="px-6 py-4">{getAuthorEmail(item.authorId)}</td>
                                <td className="px-6 py-4">{t(item.type)}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[item.status]}`}>
                                        {t(item.status.replace(/-/g, ''))}
                                    </span>
                                </td>
                                <td className="px-6 py-4">{new Date(item.createdAt).toLocaleDateString()}</td>
                                <td className="px-6 py-4 space-x-2 rtl:space-x-reverse whitespace-nowrap">
                                    {renderWorkflowActions(item)}
                                    {canEditOrDelete(item) && (
                                        <>
                                            <button onClick={() => onEditItem(item)} className="font-medium text-blue-400 hover:underline">{t('edit')}</button>
                                            <button onClick={() => onRemoveItem(item.id)} className="font-medium text-red-400 hover:underline">{t('delete')}</button>
                                        </>
                                    )}
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
            {isScheduleModalOpen && (
                <BulkScheduleModal
                    isOpen={isScheduleModalOpen}
                    onClose={() => setIsScheduleModalOpen(false)}
                    onConfirm={handleBulkSchedule}
                    itemCount={selectedItems.size}
                />
            )}
        </div>
    );
};

export default ContentLibraryView;

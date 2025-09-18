// This is the main application component. It manages state, context, and view rendering.
import React, { useState, useEffect, createContext, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import NewContentView from './components/NewContentView';
import ContentLibraryView from './components/ContentLibraryView';
import CalendarView from './components/CalendarView';
import SettingsView from './components/SettingsView';
import Notification from './components/Notification';
import AuthView from './components/AuthView';
import { WordPressSite, GeneratedContent, Notification as NotificationType, LanguageContextType, LanguageCode, User, UserRole, ContentStatus } from './types';
import { getT } from './i18n';
import { getSiteStats } from './services/wordpressService';
import { USERS } from './services/backendService';

// Create a context for language and translation function
export const LanguageContext = createContext<LanguageContextType | null>(null);

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [currentView, setCurrentView] = useState('dashboard');
    const [sites, setSites] = useState<WordPressSite[]>([]);
    const [library, setLibrary] = useState<GeneratedContent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [notification, setNotification] = useState<NotificationType | null>(null);
    const [language, setLanguage] = useState<LanguageCode>(() => (localStorage.getItem('language') as LanguageCode) || 'en');
    const [editingContent, setEditingContent] = useState<GeneratedContent | null>(null);

    // Load data from localStorage on initial render
    useEffect(() => {
        try {
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                const user: User = JSON.parse(savedUser);
                setCurrentUser(user);
            }

            const savedSites = localStorage.getItem('wp-sites');
            if (savedSites) {
                const parsedSites: WordPressSite[] = JSON.parse(savedSites);
                setSites(parsedSites);
                parsedSites.forEach(site => {
                    if (!site.isVirtual) {
                        getSiteStats(site).then(stats => {
                            updateSite(site.id, { stats });
                        });
                    }
                });
            }
            const savedLibrary = localStorage.getItem('content-library');
            if (savedLibrary) {
                setLibrary(JSON.parse(savedLibrary));
            }
        } catch (error) {
            console.error("Failed to load data from localStorage", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Save data to localStorage whenever it changes
    useEffect(() => {
        if (currentUser) {
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        } else {
            localStorage.removeItem('currentUser');
        }
    }, [currentUser]);

    useEffect(() => {
        localStorage.setItem('wp-sites', JSON.stringify(sites));
    }, [sites]);

    useEffect(() => {
        localStorage.setItem('content-library', JSON.stringify(library));
    }, [library]);
    
    useEffect(() => {
        localStorage.setItem('language', language);
        document.documentElement.lang = language;
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    }, [language]);

    const languageContextValue = useMemo(() => ({
        language,
        setLanguage,
        t: getT(language),
        dir: language === 'ar' ? 'rtl' : 'ltr' as 'rtl' | 'ltr',
    }), [language]);

    const handleLogin = (user: User) => {
        setCurrentUser(user);
    };

    const handleLogout = () => {
        setCurrentUser(null);
        // Also clear other sensitive data if necessary
        setSites([]);
        setLibrary([]);
        localStorage.removeItem('wp-sites');
        localStorage.removeItem('content-library');
    };

    const showNotification = (notif: NotificationType) => {
        setNotification(notif);
    };

    const addSite = (site: WordPressSite) => {
        if (sites.some(s => s.id === site.id)) {
            showNotification({ message: languageContextValue.t('errorUrlExists'), type: 'error' });
            return;
        }
        setSites(prevSites => [...prevSites, site]);
        showNotification({ message: languageContextValue.t('siteAddedSuccess'), type: 'success' });
    };

    const removeSite = (siteId: string) => {
        setSites(prevSites => prevSites.filter(s => s.id !== siteId));
        showNotification({ message: languageContextValue.t('siteRemovedSuccess'), type: 'success' });
    };

    const updateSite = (siteId: string, updates: Partial<WordPressSite>) => {
        setSites(prevSites =>
            prevSites.map(s => (s.id === siteId ? { ...s, ...updates } : s))
        );
    };
    
    const addContentToLibrary = (content: GeneratedContent | GeneratedContent[]) => {
        const contentArray = Array.isArray(content) ? content : [content];
        const newContent = contentArray.map(c => ({...c, authorId: currentUser?.id }));
        setLibrary(prev => [...newContent, ...prev]);
        setCurrentView('library');
        showNotification({ message: languageContextValue.t('contentAddedToLibrary'), type: 'success' });
    };
    
    const updateLibraryItem = (id: string, updates: Partial<GeneratedContent>) => {
        const item = library.find(i => i.id === id);
        if (!item) return;

        const newStatus = updates.status;
        const oldStatus = item.status;
        
        // Custom Notifications
        if (newStatus && newStatus !== oldStatus) {
            const author = USERS.find(u => u.id === item.authorId);
            const editor = currentUser; // The user making the change is the editor

            if (newStatus === 'needs-review') {
                showNotification({ message: `'${item.title}' ${languageContextValue.t('submittedForReviewBy')} ${author?.email}`, type: 'info' });
            } else if (newStatus === 'approved') {
                showNotification({ message: `'${item.title}' ${languageContextValue.t('approvedBy')} ${editor?.email}`, type: 'success' });
            } else if (newStatus === 'draft' && oldStatus === 'needs-review') {
                showNotification({ message: `'${item.title}' ${languageContextValue.t('rejectedBy')} ${editor?.email}`, type: 'error' });
            }
        }

        setLibrary(prev => prev.map(item => item.id === id ? { ...item, ...updates, updatedAt: new Date() } : item));
    };

    const removeLibraryItem = (id: string) => {
        setLibrary(prev => prev.filter(item => item.id !== id));
        showNotification({ message: languageContextValue.t('contentDeleted'), type: 'success' });
    };
    
    const handleEditItem = (content: GeneratedContent) => {
        setEditingContent(content);
        setCurrentView('new-content');
    };

    const renderView = () => {
        switch (currentView) {
            case 'dashboard':
                return <DashboardView sites={sites} onAddSite={addSite} onRemoveSite={removeSite} onUpdateSite={updateSite} showNotification={showNotification} isLoading={isLoading} />;
            case 'new-content':
                return <NewContentView onContentGenerated={addContentToLibrary} existingContent={editingContent} onClearEditing={() => setEditingContent(null)} onUpdateLibraryItem={updateLibraryItem} sites={sites} showNotification={showNotification}/>;
            case 'library':
                return <ContentLibraryView library={library} onUpdateItem={updateLibraryItem} onRemoveItem={removeLibraryItem} onEditItem={handleEditItem} sites={sites} showNotification={showNotification} currentUser={currentUser!} />;
            case 'calendar':
                return <CalendarView library={library} onEditItem={handleEditItem} onUpdateItem={updateLibraryItem} />;
            case 'settings':
                return <SettingsView onLogout={handleLogout}/>;
            default:
                return <DashboardView sites={sites} onAddSite={addSite} onRemoveSite={removeSite} onUpdateSite={updateSite} showNotification={showNotification} isLoading={isLoading} />;
        }
    };
    
    if (!currentUser) {
        return <AuthView onLogin={handleLogin} />;
    }

    return (
        <LanguageContext.Provider value={languageContextValue}>
            <div className={`flex h-screen bg-gray-900 font-sans ${language === 'ar' ? 'rtl' : 'ltr'}`}>
                <Sidebar currentView={currentView} setCurrentView={setCurrentView} onLogout={handleLogout} currentUser={currentUser} />
                <main className="flex-1 overflow-y-auto">
                    {renderView()}
                </main>
                <Notification notification={notification} onClose={() => setNotification(null)} />
            </div>
        </LanguageContext.Provider>
    );
};

export default App;

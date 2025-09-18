
import React, { useState, useContext } from 'react';
import { WordPressSite, LanguageContextType, Notification } from '../types';
import SiteCard from './SiteCard';
import { addSite } from '../services/wordpressService';
import Spinner from './common/Spinner';
import { LanguageContext } from '../App';

interface DashboardViewProps {
  sites: WordPressSite[];
  onAddSite: (site: WordPressSite) => void;
  onRemoveSite: (siteId: string) => void;
  onUpdateSite: (siteId: string, updates: Partial<WordPressSite>) => void;
  showNotification: (notification: Notification) => void;
  isLoading: boolean;
}

const DashboardView: React.FC<DashboardViewProps> = ({ sites, onAddSite, onRemoveSite, onUpdateSite, showNotification, isLoading }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');
  const { t } = useContext(LanguageContext as React.Context<LanguageContextType>);
  
  // State for the active tab
  const [addMode, setAddMode] = useState<'connected' | 'virtual'>('connected');

  // State for connected site form
  const [newSiteUrl, setNewSiteUrl] = useState('');
  const [newSiteUsername, setNewSiteUsername] = useState('');
  const [newSitePassword, setNewSitePassword] = useState('');

  // State for virtual site form
  const [virtualSiteName, setVirtualSiteName] = useState('');
  const [virtualSiteUrl, setVirtualSiteUrl] = useState('');


  const handleAddConnectedSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiteUrl.trim() || !newSiteUsername.trim() || !newSitePassword.trim()) {
      setError(t('errorAllFieldsRequired'));
      return;
    }
    setError('');
    setIsAdding(true);
    try {
      const newSite = await addSite(newSiteUrl, newSiteUsername, newSitePassword);
      onAddSite(newSite);
      setNewSiteUrl('');
      setNewSiteUsername('');
      setNewSitePassword('');
    } catch (err) {
       if (err instanceof Error && (err.message.includes("already been added") || err.message.includes("exists"))) {
          setError(t('errorUrlExists'));
      } else {
        setError(err instanceof Error ? err.message : t('errorUnknown'));
      }
    } finally {
      setIsAdding(false);
    }
  };
  
  const handleAddVirtualSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!virtualSiteUrl.trim() || !virtualSiteName.trim()) {
        setError(t('errorAllFieldsRequired'));
        return;
    }
    let cleanedUrl: string;
    try {
        cleanedUrl = new URL(virtualSiteUrl).origin;
    } catch (err) {
        setError(t('errorInvalidUrl'));
        return;
    }
    
    if (sites.some(s => s.id === cleanedUrl)) {
        setError(t('errorUrlExists'));
        return;
    }

    setError('');
    const newVirtualSite: WordPressSite = {
        id: cleanedUrl,
        url: cleanedUrl,
        name: virtualSiteName,
        isVirtual: true,
        stats: { posts: 0, pages: 0, products: 0 },
        username: '', // Not needed
        appPassword: '' // Not needed
    };
    onAddSite(newVirtualSite);
    setVirtualSiteName('');
    setVirtualSiteUrl('');
  };
  
  const renderConnectedForm = () => (
      <form onSubmit={handleAddConnectedSite} className="space-y-4">
        <div>
          <label htmlFor="siteUrl" className="text-sm font-medium text-gray-400 mb-1 block">{t('siteUrl')}</label>
          <input
            id="siteUrl" type="url" value={newSiteUrl} onChange={(e) => setNewSiteUrl(e.target.value)}
            placeholder={t('siteUrlPlaceholder')}
            className="w-full bg-gray-700 text-white placeholder-gray-400 rounded-md px-4 py-2 border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            disabled={isAdding}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="wpUser" className="text-sm font-medium text-gray-400 mb-1 block">{t('username')}</label>
            <input
              id="wpUser" type="text" value={newSiteUsername} onChange={(e) => setNewSiteUsername(e.target.value)}
              placeholder={t('usernamePlaceholder')}
              className="w-full bg-gray-700 text-white placeholder-gray-400 rounded-md px-4 py-2 border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              disabled={isAdding}
            />
          </div>
          <div>
            <label htmlFor="wpAppPass" className="text-sm font-medium text-gray-400 mb-1 block">{t('appPassword')}</label>
            <input
              id="wpAppPass" type="password" value={newSitePassword} onChange={(e) => setNewSitePassword(e.target.value)}
              placeholder={t('appPasswordPlaceholder')}
              className="w-full bg-gray-700 text-white placeholder-gray-400 rounded-md px-4 py-2 border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              disabled={isAdding}
            />
          </div>
        </div>
        <button type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md flex items-center justify-center transition-colors disabled:bg-blue-800 disabled:cursor-not-allowed"
          disabled={isAdding}>
          {isAdding ? <Spinner size="sm"/> : t('addSite')}
        </button>
      </form>
  );

  const renderVirtualForm = () => (
      <form onSubmit={handleAddVirtualSite} className="space-y-4">
          <p className="text-sm text-gray-400">{t('virtualSiteDesc')}</p>
          <div>
              <label htmlFor="virtualSiteName" className="text-sm font-medium text-gray-400 mb-1 block">{t('siteName')}</label>
              <input
                  id="virtualSiteName" type="text" value={virtualSiteName} onChange={(e) => setVirtualSiteName(e.target.value)}
                  placeholder={t('siteNamePlaceholder')}
                  className="w-full bg-gray-700 text-white placeholder-gray-400 rounded-md px-4 py-2 border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
          </div>
          <div>
              <label htmlFor="virtualSiteUrl" className="text-sm font-medium text-gray-400 mb-1 block">{t('siteUrl')}</label>
              <input
                  id="virtualSiteUrl" type="url" value={virtualSiteUrl} onChange={(e) => setVirtualSiteUrl(e.target.value)}
                  placeholder={t('siteUrlPlaceholder')}
                  className="w-full bg-gray-700 text-white placeholder-gray-400 rounded-md px-4 py-2 border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
          </div>
          <button type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md flex items-center justify-center transition-colors">
              {t('addVirtualSite')}
          </button>
      </form>
  );


  return (
    <div className="p-8 h-full">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">{t('dashboard')}</h1>
      </header>
      
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-300 mb-4">{t('addNewSite')}</h2>
        <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex border-b border-gray-700 mb-4">
                <button onClick={() => setAddMode('connected')} className={`py-2 px-4 text-sm font-medium ${addMode === 'connected' ? 'border-b-2 border-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}>
                    {t('connectSite')}
                </button>
                <button onClick={() => setAddMode('virtual')} className={`py-2 px-4 text-sm font-medium ${addMode === 'virtual' ? 'border-b-2 border-purple-500 text-white' : 'text-gray-400 hover:text-white'}`}>
                    {t('addVirtualSite')}
                </button>
            </div>
            
            {addMode === 'connected' ? renderConnectedForm() : renderVirtualForm()}
            {error && <p className="text-red-400 mt-2 text-sm">{error}</p>}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-300 mb-4">{t('connectedSites')}</h2>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner />
          </div>
        ) : sites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sites.map(site => (
              <SiteCard key={site.id} site={site} onRemove={onRemoveSite} onUpdate={onUpdateSite} showNotification={showNotification} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-800 rounded-lg">
            <p className="text-gray-400">{t('noSites')}</p>
            <p className="text-gray-500 text-sm mt-1">{t('noSitesHint')}</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default DashboardView;

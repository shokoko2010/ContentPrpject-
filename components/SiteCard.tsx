
import React, { useState, useContext, useEffect } from 'react';
import { WordPressSite, LanguageContextType, Notification } from '../types';
import { GlobeIcon, TrashIcon, EditIcon, SyncIcon } from '../constants';
import { LanguageContext } from '../App';
import { testSiteConnection } from '../services/wordpressService';
import Spinner from './common/Spinner';


interface SiteCardProps {
  site: WordPressSite;
  onRemove: (siteId: string) => void;
  onUpdate: (siteId: string, updates: Partial<WordPressSite>) => void;
  showNotification: (notification: Notification) => void;
}

const SiteCard: React.FC<SiteCardProps> = ({ site, onRemove, onUpdate, showNotification }) => {
  const { t } = useContext(LanguageContext as React.Context<LanguageContextType>);
  const [isEditing, setIsEditing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [formData, setFormData] = useState({
      name: site.name,
      url: site.url,
      username: site.username || '',
      appPassword: site.appPassword || '',
  });

  useEffect(() => {
    // Reset form data if the site prop changes (e.g., after an update from parent)
    setFormData({
        name: site.name,
        url: site.url,
        username: site.username || '',
        appPassword: site.appPassword || '',
    });
  }, [site]);

  const handleTestConnection = async () => {
    setIsTesting(true);
    // Use the currently saved site data for testing, not unsaved form data
    const result = await testSiteConnection(site);
    if (result.success) {
        showNotification({ message: t('connectionSuccess'), type: 'success' });
    } else {
        showNotification({ message: t('connectionFail', { error: result.error || 'Unknown error' }), type: 'error' });
    }
    setIsTesting(false);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || (site.isVirtual && !formData.url.trim())) {
        showNotification({ message: t('errorAllFieldsRequired'), type: 'error' });
        return;
    }
    onUpdate(site.id, formData);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form to original site data
    setFormData({
        name: site.name,
        url: site.url,
        username: site.username || '',
        appPassword: site.appPassword || '',
    });
  };
  
  const handleConfirmDelete = () => {
      onRemove(site.id);
      setIsConfirmingDelete(false);
  };

  const renderDisplayView = () => (
    <>
      <div>
        <div className="flex justify-between items-start mb-1">
            <h3 className="text-lg font-bold text-white pr-20">{site.name}</h3>
            <div className="absolute top-4 right-4 flex items-center space-x-2 rtl:space-x-reverse">
                <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-white transition-colors" title={t('editSite')}>
                    <EditIcon />
                </button>
                <button onClick={() => setIsConfirmingDelete(true)} className="text-gray-400 hover:text-red-400 transition-colors" title={t('delete')}>
                    <TrashIcon />
                </button>
            </div>
        </div>
        {site.isVirtual && (
            <span className="absolute top-5 right-28 text-xs bg-purple-600 text-white font-semibold py-1 px-2 rounded">{t('virtualSite')}</span>
        )}
        <a href={site.url} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-blue-400 hover:text-blue-300 transition-colors mb-4">
          <GlobeIcon />
          <span className="ms-2 truncate">{site.url}</span>
        </a>
        
        {site.isVirtual ? (
            <div className="text-center text-sm mt-4 py-8 border-t border-b border-gray-700">
                <p className="text-gray-400">{t('virtualSiteInfo')}</p>
            </div>
        ) : (
            <div className="grid grid-cols-3 gap-2 text-center text-sm mt-4">
              <div>
                <p className="font-bold text-lg text-white">{site.stats.posts}</p>
                <p className="text-gray-400">{t('article')+'s'}</p>
              </div>
              <div>
                <p className="font-bold text-lg text-white">{site.stats.pages}</p>
                <p className="text-gray-400">Pages</p>
              </div>
              <div>
                <p className="font-bold text-lg text-white">{site.stats.products}</p>
                <p className="text-gray-400">{t('product')+'s'}</p>
              </div>
            </div>
        )}
      </div>
      <div className="mt-6">
        {!site.isVirtual && (
            <button 
                onClick={handleTestConnection}
                disabled={isTesting}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold py-2 px-3 rounded-md transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-wait"
            >
                {isTesting ? <Spinner size="sm"/> : <SyncIcon />}
                <span className="ms-2">{isTesting ? t('testingConnection') : t('testConnection')}</span>
            </button>
        )}
      </div>
    </>
  );

  const renderEditView = () => (
    <form onSubmit={handleUpdate} className="space-y-3">
        <div>
            <label className="text-xs font-medium text-gray-400 block mb-1">{t('siteName')}</label>
            <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleInputChange}
                className="w-full bg-gray-700 text-white rounded-md px-3 py-1.5 border border-gray-600 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
        </div>
        <div>
            <label className="text-xs font-medium text-gray-400 block mb-1">{t('siteUrl')}</label>
            <input 
                type="url" 
                name="url" 
                value={formData.url} 
                onChange={handleInputChange}
                disabled={!site.isVirtual}
                className="w-full bg-gray-700 text-white rounded-md px-3 py-1.5 border border-gray-600 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:bg-gray-800 disabled:cursor-not-allowed"
            />
        </div>
        {!site.isVirtual && (
            <>
                <div>
                    <label className="text-xs font-medium text-gray-400 block mb-1">{t('username')}</label>
                    <input 
                        type="text" 
                        name="username" 
                        value={formData.username} 
                        onChange={handleInputChange}
                        className="w-full bg-gray-700 text-white rounded-md px-3 py-1.5 border border-gray-600 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                </div>
                 <div>
                    <label className="text-xs font-medium text-gray-400 block mb-1">{t('appPassword')}</label>
                    <input 
                        type="password" 
                        name="appPassword" 
                        value={formData.appPassword} 
                        onChange={handleInputChange}
                        placeholder={t('appPasswordPlaceholder')}
                        className="w-full bg-gray-700 text-white rounded-md px-3 py-1.5 border border-gray-600 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                </div>
            </>
        )}
        <div className="pt-2 flex justify-end space-x-2 rtl:space-x-reverse">
            <button 
                type="button" 
                onClick={handleCancelEdit}
                className="bg-gray-600 hover:bg-gray-500 text-white text-xs font-bold py-2 px-3 rounded-md transition-colors"
            >
                {t('cancelEdit')}
            </button>
            <button 
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-3 rounded-md transition-colors"
            >
                {t('saveChanges')}
            </button>
        </div>
    </form>
  );

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-5 flex flex-col justify-between relative">
      {isEditing ? renderEditView() : renderDisplayView()}
      
      {isConfirmingDelete && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-90 flex flex-col justify-center items-center p-4 rounded-lg z-10 animate-fade-in">
              <h4 className="font-bold text-lg text-white text-center mb-2">{t('confirmDeleteTitle')}</h4>
              <p className="text-sm text-gray-300 text-center mb-6">{t('confirmDeleteMessage', { name: site.name })}</p>
              <div className="flex space-x-4 rtl:space-x-reverse">
                  <button onClick={() => setIsConfirmingDelete(false)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md text-xs transition-colors">
                      {t('cancel')}
                  </button>
                  <button onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md text-xs transition-colors">
                      {t('confirmDelete')}
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};

export default SiteCard;

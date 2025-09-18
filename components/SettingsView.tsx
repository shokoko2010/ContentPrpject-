// This file was created to provide a settings management UI.
import React, { useState, useContext, useEffect } from 'react';
import { LanguageContext } from '../App';
import { LanguageContextType, LanguageCode, Notification } from '../types';

const BRAND_VOICE_STORAGE_KEY = 'brand_voice';

interface SettingsViewProps {
    onLogout: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ onLogout }) => {
    const { language, setLanguage, t } = useContext(LanguageContext as React.Context<LanguageContextType>);
    const [brandVoice, setBrandVoice] = useState('');
    const [notification, setNotification] = useState<Notification | null>(null);

    useEffect(() => {
        const storedBrandVoice = localStorage.getItem(BRAND_VOICE_STORAGE_KEY) || '';
        setBrandVoice(storedBrandVoice);
    }, []);

    const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setLanguage(e.target.value as LanguageCode);
    };

    const handleSaveSettings = () => {
        localStorage.setItem(BRAND_VOICE_STORAGE_KEY, brandVoice);
        
        showNotification({ message: t('settingsSaved'), type: 'success' });
    };

    const showNotification = (notif: Notification) => {
        setNotification(notif);
        setTimeout(() => setNotification(null), 3000);
    };

    return (
        <div className="p-8 h-full text-white">
            <header className="mb-8">
                <h1 className="text-3xl font-bold">{t('settingsTitle')}</h1>
                <p className="text-gray-400 mt-1">{t('settingsDescription')}</p>
            </header>

            <div className="max-w-2xl space-y-8">
                {/* Language Settings */}
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h2 className="text-xl font-semibold mb-4">{t('languageSettings')}</h2>
                    <div>
                        <label htmlFor="language-select" className="block text-sm font-medium text-gray-300 mb-2">{t('selectLanguage')}</label>
                        <select id="language-select" value={language} onChange={handleLanguageChange} className="w-full bg-gray-700 text-white rounded-md px-4 py-2 border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                            <option value="en">English</option>
                            <option value="ar">العربية (Arabic)</option>
                        </select>
                    </div>
                </div>

                {/* Brand Voice Settings */}
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h2 className="text-xl font-semibold mb-4">{t('brandVoice')}</h2>
                     <p className="text-sm text-gray-400 mb-4">{t('brandVoiceDescription')}</p>
                    <div>
                        <label htmlFor="brand-voice" className="block text-sm font-medium text-gray-300 mb-2">{t('brandVoiceLabel')}</label>
                        <textarea
                            id="brand-voice"
                            rows={6}
                            value={brandVoice}
                            onChange={(e) => setBrandVoice(e.target.value)}
                            placeholder={t('brandVoicePlaceholder')}
                            className="w-full bg-gray-700 text-white placeholder-gray-400 rounded-md px-4 py-2 border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>
                </div>

                <div className="flex justify-between">
                    <button onClick={onLogout} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-md transition-colors">
                        {t('logoutButton')}
                    </button>
                    <button onClick={handleSaveSettings} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md transition-colors">
                        {t('saveSettings')}
                    </button>
                </div>
            </div>
            
            {notification && (
                <div className={`fixed bottom-5 right-5 p-4 rounded-lg text-white ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                    {notification.message}
                </div>
            )}
        </div>
    );
};

export default SettingsView;

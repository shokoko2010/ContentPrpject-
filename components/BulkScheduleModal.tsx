import React, { useState, useContext } from 'react';
import Modal from './common/Modal';
import { LanguageContext } from '../App';
import { LanguageContextType } from '../types';

interface BulkScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (startDate: string, intervalDays: number) => void;
  itemCount: number;
}

const toDatetimeLocal = (isoDate?: string) => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    const timezoneOffset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - timezoneOffset);
    return localDate.toISOString().slice(0, 16);
};

const getDefaultStartDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return toDatetimeLocal(tomorrow.toISOString());
};

const BulkScheduleModal: React.FC<BulkScheduleModalProps> = ({ isOpen, onClose, onConfirm, itemCount }) => {
    const { t } = useContext(LanguageContext as React.Context<LanguageContextType>);
    const [startDate, setStartDate] = useState(getDefaultStartDate());
    const [intervalDays, setIntervalDays] = useState(1);
    
    const handleSubmit = () => {
        if (startDate && intervalDays > 0) {
            onConfirm(startDate, intervalDays);
        }
    };
    
    if (!isOpen) return null;

    return (
        <Modal title={t('bulkScheduleTitle', { count: itemCount })} onClose={onClose}>
            <div className="space-y-4 text-gray-300">
                <div>
                    <label htmlFor="start-date" className="block text-sm font-medium mb-1">{t('startDate')}</label>
                    <input
                        id="start-date"
                        type="datetime-local"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="mt-1 block w-full bg-gray-600 border-gray-500 rounded-md text-white"
                        min={toDatetimeLocal(new Date().toISOString())}
                    />
                </div>
                <div>
                    <label htmlFor="interval-days" className="block text-sm font-medium mb-1">{t('interval')}</label>
                    <input
                        id="interval-days"
                        type="number"
                        value={intervalDays}
                        onChange={(e) => setIntervalDays(parseInt(e.target.value, 10) || 1)}
                        min="1"
                        className="mt-1 block w-full bg-gray-600 border-gray-500 rounded-md text-white"
                    />
                </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3 rtl:space-x-reverse">
                 <button onClick={onClose} className="bg-gray-500 hover:bg-gray-400 text-white font-bold py-2 px-4 rounded-md transition-colors">{t('cancel')}</button>
                 <button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
                    {t('applySchedule')}
                 </button>
            </div>
        </Modal>
    );
};

export default BulkScheduleModal;
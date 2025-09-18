import React, { useRef, useContext } from 'react';
import { LanguageContext } from '../App';
import { LanguageContextType } from '../types';

// Icons for the toolbar
const BoldIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"></path></svg>;
const ItalicIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"></path></svg>;
const H2Icon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true"><text x="2" y="18" fontSize="16" fontWeight="bold">H2</text></svg>;
const H3Icon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true"><text x="2" y="18" fontSize="16" fontWeight="bold">H3</text></svg>;
const LinkIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"></path></svg>;
const UlIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"></path></svg>;
const OlIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"></path></svg>;
const QuoteIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M6 17h3l2-4V7H5v6h3l-2 4zm8 0h3l2-4V7h-6v6h3l-2 4z"></path></svg>;


interface RichTextEditorProps {
    id: string;
    value: string;
    onChange: (newValue: string) => void;
    rows?: number;
    className?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ id, value, onChange, rows = 10, className }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { t } = useContext(LanguageContext as React.Context<LanguageContextType>);

    const applyMarkdown = (prefix: string, suffix: string = '') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = value.substring(start, end);

        const newText = `${value.substring(0, start)}${prefix}${selectedText}${suffix}${value.substring(end)}`;
        onChange(newText);

        setTimeout(() => {
            textarea.focus();
            // If there was no selection, place cursor in the middle
            if (start === end) {
                textarea.selectionStart = textarea.selectionEnd = start + prefix.length;
            } else {
                textarea.selectionStart = start + prefix.length;
                textarea.selectionEnd = end + prefix.length;
            }
        }, 0);
    };
    
    const applyLinePrefix = (prefix: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        
        // Find the start of the line(s)
        let lineStart = start;
        while(lineStart > 0 && value[lineStart - 1] !== '\n') {
            lineStart--;
        }

        const textBefore = value.substring(0, lineStart);
        const selectedLinesText = value.substring(lineStart, end);
        const textAfter = value.substring(end);

        const lines = selectedLinesText.split('\n');
        const newLines = lines.map(line => line ? `${prefix}${line}` : line);
        const newSelectedText = newLines.join('\n');
        
        const newText = `${textBefore}${newSelectedText}${textAfter}`;
        onChange(newText);
        
        setTimeout(() => {
            textarea.focus();
            textarea.selectionStart = start + prefix.length;
            textarea.selectionEnd = end + (newLines.length * prefix.length);
        }, 0);
    };

    const handleLink = () => {
        const url = prompt(t('enterUrl'));
        if (url) {
            applyMarkdown('[', `](${url})`);
        }
    };

    const toolbarButtons = [
        { icon: <BoldIcon />, action: () => applyMarkdown('**', '**'), title: t('bold') },
        { icon: <ItalicIcon />, action: () => applyMarkdown('*', '*'), title: t('italic') },
        { icon: <H2Icon />, action: () => applyLinePrefix('## '), title: t('heading2') },
        { icon: <H3Icon />, action: () => applyLinePrefix('### '), title: t('heading3') },
        { icon: <QuoteIcon />, action: () => applyLinePrefix('> '), title: t('blockquote') },
        { icon: <LinkIcon />, action: handleLink, title: t('insertLink') },
        { icon: <UlIcon />, action: () => applyLinePrefix('* '), title: t('unorderedList') },
        { icon: <OlIcon />, action: () => applyLinePrefix('1. '), title: t('orderedList') },
    ];
    
    return (
        <div>
            <div className="flex items-center space-x-1 rtl:space-x-reverse bg-gray-900/50 p-2 rounded-t-md border-b border-gray-600">
                {toolbarButtons.map((btn, index) => (
                    <button
                        key={index}
                        type="button"
                        onClick={btn.action}
                        title={btn.title}
                        className="p-2 rounded text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                        aria-label={btn.title}
                    >
                        {btn.icon}
                    </button>
                ))}
            </div>
            <textarea
                id={id}
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={rows}
                className={`${className} rounded-b-md rounded-t-none`}
            />
        </div>
    );
};

export default RichTextEditor;
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from '../i18n/en.json';
import hi from '../i18n/hi.json';

const translations: Record<string, any> = { en, hi };

interface LanguageContextProps {
  language: 'en' | 'hi';
  setLanguage: (lang: 'en' | 'hi') => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextProps>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLang] = useState<'en' | 'hi'>('en');

  useEffect(() => {
    AsyncStorage.getItem('language_preference').then((savedLang) => {
      if (savedLang === 'en' || savedLang === 'hi') {
        setLang(savedLang);
      }
    });
  }, []);

  const setLanguage = (lang: 'en' | 'hi') => {
    setLang(lang);
    AsyncStorage.setItem('language_preference', lang);
  };

  const t = (key: string): string => {
    const dict = translations[language] || translations.en;
    const parts = key.split('.');
    let current = dict;
    for (const part of parts) {
      if (current && typeof current === 'object') {
        current = current[part];
      } else {
        return key;
      }
    }
    return typeof current === 'string' ? current : key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../../contexts/LanguageContext';
import { Theme } from '../../constants/theme';
import { AlertTriangle, MapPin, Radio } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function Onboarding() {
  const { t, language, setLanguage } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const offset = event.nativeEvent.contentOffset.x;
    const index = Math.round(offset / slideSize);
    setActiveIndex(index);
  };

  const finishOnboarding = async () => {
    try {
      await AsyncStorage.setItem('onboarding_completed', 'true');
      router.replace('/(auth)/login');
    } catch (err) {
      router.replace('/(auth)/login');
    }
  };

  const nextSlide = () => {
    if (activeIndex < 2) {
      scrollViewRef.current?.scrollTo({
        x: (activeIndex + 1) * width,
        animated: true
      });
      setActiveIndex(activeIndex + 1);
    } else {
      finishOnboarding();
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

  const slides = [
    {
      title: t('onboarding.slide1Title'),
      desc: t('onboarding.slide1Desc'),
      icon: <AlertTriangle size={80} color={Theme.light.accent} />
    },
    {
      title: t('onboarding.slide12Title'),
      desc: t('onboarding.slide2Desc'),
      icon: <MapPin size={80} color={Theme.light.info} />
    },
    {
      title: t('onboarding.slide3Title'),
      desc: t('onboarding.slide3Desc'),
      icon: <Radio size={80} color={Theme.light.success} />
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Language Toggle on Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.langBtn} onPress={toggleLanguage}>
          <Text style={styles.langText}>
            {language === 'en' ? 'हिन्दी (Hindi)' : 'English'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sliding Carousel */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {slides.map((slide, index) => (
          <View key={index} style={styles.slide}>
            <View style={styles.iconContainer}>{slide.icon}</View>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.description}>{slide.desc}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Paginator dots and Navigation CTA */}
      <View style={styles.footer}>
        <View style={styles.dotsContainer}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                activeIndex === index ? styles.activeDot : styles.inactiveDot
              ]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.btn} onPress={nextSlide}>
          <Text style={styles.btnText}>
            {activeIndex === 2 ? t('onboarding.getStarted') : t('onboarding.next')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F9',
    justifyContent: 'space-between'
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'flex-end'
  },
  langBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1
  },
  langText: {
    fontSize: 14,
    color: '#0B2545',
    fontWeight: '600'
  },
  scrollView: {
    flex: 1
  },
  slide: {
    width: width,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    shadowColor: '#0B2545',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4
  },
  title: {
    fontSize: 26,
    color: '#0B2545',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16
  },
  description: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10
  },
  footer: {
    paddingHorizontal: 30,
    paddingBottom: 40,
    alignItems: 'center'
  },
  dotsContainer: {
    flexDirection: 'row',
    marginBottom: 30
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4
  },
  activeDot: {
    width: 24,
    backgroundColor: '#EE6C4D'
  },
  inactiveDot: {
    width: 8,
    backgroundColor: '#CBD5E1'
  },
  btn: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0B2545',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0B2545',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  btnText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600'
  }
});

"use client";

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';

import DashboardKeseluruhan from './components/DashboardKeseluruhan';
import DashboardKelas7 from './components/DashboardKelas7';
import DashboardKelas8 from './components/DashboardKelas8';
import DashboardKelas9 from './components/DashboardKelas9';

function MainContent() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const searchParams = useSearchParams();

  // State pengaturan Auto-Slide dari MySQL
  const [autoSlideEnabled, setAutoSlideEnabled] = useState<boolean>(true);
  const [slideIntervalSec, setSlideIntervalSec] = useState<number>(15);
  const [isPausedByModal, setIsPausedByModal] = useState<boolean>(false);

  const dashboards = [
    <DashboardKeseluruhan key="0" />,
    <DashboardKelas7 key="1" />,
    <DashboardKelas8 key="2" />,
    <DashboardKelas9 key="3" />
  ];

  // 1. Fungsi memuat pengaturan Auto-Slide dari MySQL (/api/pengaturan)
  const loadSettingsFromDB = useCallback(async () => {
    try {
      const res = await fetch('/api/pengaturan', { cache: 'no-store' });
      const result = await res.json();
      if (result.success && result.data) {
        setAutoSlideEnabled(Boolean(result.data.autoSlideEnabled));
        if (Number(result.data.slideIntervalSec) >= 3) {
          setSlideIntervalSec(Number(result.data.slideIntervalSec));
        }
      }
    } catch (err) {
      console.error('Gagal memuat pengaturan auto-slide dari database:', err);
    }
  }, []);

  useEffect(() => {
    const handleModalPause = (e: any) => {
      setIsPausedByModal(Boolean(e.detail?.isPaused));
    };

    const handleManualSlide = (e: any) => {
      if (typeof e.detail?.index === 'number') {
        setCurrentIndex(e.detail.index);
      }
    };

    loadSettingsFromDB();
    window.addEventListener('autoSlideSettingsChanged', loadSettingsFromDB);
    window.addEventListener('stsModalStateChanged', handleModalPause);
    window.addEventListener('stsChangeSlide', handleManualSlide);

    return () => {
      window.removeEventListener('autoSlideSettingsChanged', loadSettingsFromDB);
      window.removeEventListener('stsModalStateChanged', handleModalPause);
      window.removeEventListener('stsChangeSlide', handleManualSlide);
    };
  }, [loadSettingsFromDB]);

  // 2. Sesuaikan posisi slide jika ada parameter URL (?tab=... atau ?openAdmin=true)
  useEffect(() => {
    const tab = searchParams.get('tab');
    const openAdmin = searchParams.get('openAdmin');

    if (openAdmin === 'true' || tab === 'home') {
      setCurrentIndex(0);
    } else if (tab === 'kelas7') {
      setCurrentIndex(1);
    } else if (tab === 'kelas8') {
      setCurrentIndex(2);
    } else if (tab === 'kelas9') {
      setCurrentIndex(3);
    }
  }, [searchParams]);

  // 3. Timer Otomatis Beralih: Keseluruhan (0) -> Kelas 7 (1) -> Kelas 8 (2) -> Kelas 9 (3) -> Keseluruhan (0)
  useEffect(() => {
    if (!autoSlideEnabled || isPausedByModal) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % dashboards.length);
    }, slideIntervalSec * 1000);

    return () => clearInterval(timer);
  }, [autoSlideEnabled, slideIntervalSec, isPausedByModal, dashboards.length]);

  // Fungsi geser manual (Swipe)
  const handleDragEnd = (e: any, info: any) => {
    const threshold = 50;
    if (info.offset.x < -threshold && currentIndex < dashboards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (info.offset.x > threshold && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black select-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          className="absolute inset-0 h-full w-full cursor-grab active:cursor-grabbing"
        >
          {dashboards[currentIndex]}
        </motion.div>
      </AnimatePresence>

      {/* Indikator Titik Navigasi & Status Auto-Slide di Bagian Bawah */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5 bg-slate-900/50 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/20 shadow-lg">
        {['Semua', 'Kelas 7', 'Kelas 8', 'Kelas 9'].map((label, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            title={`Tampilkan ${label}`}
            className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
              currentIndex === idx ? 'w-8 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'w-2 bg-white/50 hover:bg-white/80'
            }`}
          />
        ))}
        <span className="text-[9px] font-bold text-white/90 pl-1.5 border-l border-white/20">
          {autoSlideEnabled ? `${slideIntervalSec}d` : 'OFF'}
        </span>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <MainContent />
    </Suspense>
  );
}
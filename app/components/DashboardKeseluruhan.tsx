"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, MessageSquare, Star, Settings, Menu, LogOut, 
  User, TrendingUp, AlertTriangle, Award, 
  Users, School, Activity, ShieldCheck, BookOpen, 
  BarChart2, CheckCircle2, X, Trophy, Medal, Crown, 
  Sparkles, Shield, Zap, Flame, Target,
  Brain, Lightbulb, CheckSquare, Cpu, Edit3,
  Compass, RefreshCw, Lock, Sliders, Eye, EyeOff, Key, PieChart as PieIcon, ThumbsUp
} from 'lucide-react';
import { FaGraduationCap, FaChartLine } from 'react-icons/fa';

// Import komponen Panel Admin & Panel Login Terpisah
import AdminPanel from './AdminPanel'; 
import AdminLogin from './AdminLogin'; 
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';

export default function DashboardKeseluruhan() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState('home');
  const [modalData, setModalData] = useState<any>(null);
  const [scoreModal, setScoreModal] = useState<{ type: 'highest' | 'lowest' | 'mapel' | 'tuntas' | 'remidi' | 'all_remedial'; title: string; data: any[] } | null>(null);
  // State untuk filter mapel pada modal rincian Tuntas/Remidi
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');

  // State untuk KKM yang dapat dikustomisasi
  const [kkmValue, setKkmValue] = useState<number>(75);

  // State untuk mengontrol visibilitas panel login terpisah & panel admin
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  
  // State untuk melacak status autentikasi admin agar tidak login berulang kali
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const searchParams = useSearchParams();

  // --- STATE PENGATURAN AUTO-SLIDE MYSQL ---
  const [autoSlideEnabled, setAutoSlideEnabled] = useState<boolean>(true);
  const [slideIntervalSec, setSlideIntervalSec] = useState<number>(15);
  const [isSavingSlide, setIsSavingSlide] = useState<boolean>(false);

  // Muat pengaturan Auto-Slide dari MySQL saat komponen dibuka
  useEffect(() => {
    fetch('/api/pengaturan')
      .then((res) => res.json())
      .then((result) => {
        if (result.success && result.data) {
          setAutoSlideEnabled(Boolean(result.data.autoSlideEnabled));
          setSlideIntervalSec(Number(result.data.slideIntervalSec) || 15);
        }
      })
      .catch((err) => console.error('Gagal mengambil pengaturan:', err));
  }, []);

  // Fungsi simpan pengaturan Auto-Slide ke MySQL
  const saveAutoSlideToMySQL = async (newEnabled: boolean, newInterval: number) => {
    setIsSavingSlide(true);
    try {
      const res = await fetch('/api/pengaturan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          autoSlideEnabled: newEnabled,
          slideIntervalSec: newInterval
        })
      });
      const result = await res.json();
      if (result.success) {
        setAutoSlideEnabled(result.data.autoSlideEnabled);
        setSlideIntervalSec(result.data.slideIntervalSec);
        // Beritahu app/page.tsx agar langsung menerapkan waktu baru tanpa refresh
        window.dispatchEvent(new Event('autoSlideSettingsChanged'));
      }
    } catch (err) {
      console.error('Gagal menyimpan pengaturan auto-slide:', err);
    } finally {
      setIsSavingSlide(false);
    }
  };

  // Jeda Auto-Slide otomatis ketika Modal Login, Panel Admin, atau Pop-up Detail sedang terbuka
  useEffect(() => {
    const isAnyModalOpen = showLoginModal || showAdminPanel || Boolean(modalData) || Boolean(scoreModal);
    window.dispatchEvent(new CustomEvent('stsModalStateChanged', { detail: { isPaused: isAnyModalOpen } }));
  }, [showLoginModal, showAdminPanel, modalData, scoreModal]);

  // Otomatis buka Login / Panel Admin jika diarahkan dari Kelas 7, 8, atau 9 (?openAdmin=true)
  useEffect(() => {
    if (searchParams.get('openAdmin') === 'true') {
      if (isAdminAuthenticated) {
        setShowAdminPanel(true);
      } else {
        setShowLoginModal(true);
      }
      router.replace('/');
    }
  }, [searchParams, isAdminAuthenticated, router]);

  // State untuk Hover Sidebar Show & Hide Animatif
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  // State untuk interaktif hover tooltip pada grafik per tingkat
  const [hoveredPoint7, setHoveredPoint7] = useState<{ name: string; score: number } | null>(null);
  const [hoveredPoint8, setHoveredPoint8] = useState<{ name: string; score: number } | null>(null);
  const [hoveredPoint9, setHoveredPoint9] = useState<{ name: string; score: number } | null>(null);

  // State untuk hover interaktif pada Pie Chart KKM & Pop-up 4D
  const [hoveredPieSlice, setHoveredPieSlice] = useState<'above' | 'below' | null>(null);
  
  // State utama penyimpanan data dari Panel Admin
  const [dashboardData, setDashboardData] = useState<{ [key: string]: any[] }>({
    '7': [], '8': [], '9': []
  });

  // Ambil data dari database MySQL melalui API saat komponen pertama kali dimuat
  useEffect(() => {
    async function fetchDatabaseData() {
      try {
        // Ambil data nilai siswa
        const resSiswa = await fetch('/api/siswa');
        const resultSiswa = await resSiswa.json();
        
        // Ambil data umpan balik
        const resUB = await fetch('/api/umpan-balik');
        const textUB = await resUB.text();
        let dataUB = [];
        if (textUB) {
           const parsedUB = JSON.parse(textUB);
           if (parsedUB.success && parsedUB.data) dataUB = parsedUB.data;
        }

        // Gabungkan keduanya ke dalam state dashboard
        if (resultSiswa.success && resultSiswa.data) {
          setDashboardData({ ...resultSiswa.data, umpan_balik: dataUB });
        } else {
          setDashboardData(prev => ({ ...prev, umpan_balik: dataUB }));
        }
      } catch (err) {
        console.error("Gagal memuat data dari database:", err);
      }
    }
    fetchDatabaseData();
  }, []);
  
  // State untuk mengatur keseluruhan tampilan display home
  const [displaySettings, setDisplaySettings] = useState({
    showDemografi: true,
    showZonaPerhatian: true,
    showCapaian: true,
    showPodium: true,
    showSebaran: true
  });

  // --- HELPER FUNCTIONS AMAN & ROBUST ---
  const getNama = (row: any) => row.nama || row.Nama || '-';
  const getKelas = (row: any) => row.kelas || row.Kelas || '-';
  
  const getJK = (row: any) => {
    const raw = row.jk || row.JK || '';
    return String(raw).trim().toUpperCase() || '-';
  };

  const getRataRata = (row: any) => {
    const val = row.rata_rata ?? row["RATA-RATA"] ?? row.RATA2 ?? row["RATA2"] ?? 0;
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
  };

  const getJmlSiswaGrade = (gradeKey: string) => dashboardData[gradeKey] || [];
  
  const getAllStudents = () => [
    ...(dashboardData['7'] || []),
    ...(dashboardData['8'] || []),
    ...(dashboardData['9'] || [])
  ];

  const totalSiswaAll = getAllStudents().length;
  const totalLAll = getAllStudents().filter(s => getJK(s) === 'L').length;
  const totalPAll = getAllStudents().filter(s => getJK(s) === 'P').length;

  const getGradeStats = (gradeKey: string) => {
    const students = getJmlSiswaGrade(gradeKey);
    const total = students.length;
    const lk = students.filter(s => getJK(s) === 'L').length;
    const pr = students.filter(s => getJK(s) === 'P').length;
    const validRata = students.map(s => getRataRata(s)).filter(v => v > 0);
    const avgRerata = validRata.length ? (validRata.reduce((a, b) => a + b, 0) / validRata.length).toFixed(1) : '0.0';
    const tuntas = validRata.length ? ((validRata.filter(v => v >= kkmValue).length / validRata.length) * 100).toFixed(1) : '0.0';
    
    const rombels = Array.from(new Set(students.map(s => String(getKelas(s)).trim()).filter(Boolean)));
    
    return {
      total,
      lk,
      pr,
      rerataSTS: avgRerata,
      tuntasKKM: `${tuntas}%`,
      rombelCount: rombels.length,
      rombelStr: `${rombels.length} Rombel Aktif (${rombels.join(', ') || '-'})`
    };
  };

  const uniqueRombelsAll = Array.from(new Set(getAllStudents().map(s => String(getKelas(s)).trim()).filter(Boolean)));

  const validRataAll = getAllStudents().map(s => getRataRata(s)).filter(v => v > 0);
  const avgRerataAll = validRataAll.length ? (validRataAll.reduce((a, b) => a + b, 0) / validRataAll.length).toFixed(1) : '0.0';
  const tuntasAllPercent = validRataAll.length ? ((validRataAll.filter(v => v >= kkmValue).length / validRataAll.length) * 100).toFixed(1) : '0.0';

  const statsAll = {
    total: totalSiswaAll,
    lk: totalLAll,
    pr: totalPAll,
    rasioLP: totalPAll > 0 ? (totalLAll / totalPAll).toFixed(2) + ' : 1' : '0 : 1',
    rombelCount: uniqueRombelsAll.length,
    rombelStr: `${uniqueRombelsAll.length} Rombel Aktif`,
    stsSummary: {
      rerataSTS: avgRerataAll,
      tuntasKKM: `${tuntasAllPercent}%`,
      statusSpreadsheet: totalSiswaAll > 0 ? "Valid Terverifikasi dari Data Admin" : "Belum Ada Data Diimport"
    }
  };

  const siswaDiBawahKKM = getAllStudents().filter(s => getRataRata(s) > 0 && getRataRata(s) < kkmValue);
  const siswaDiAtasKKM = getAllStudents().filter(s => getRataRata(s) >= kkmValue && getRataRata(s) > 0);
  const persentaseZonaPerhatian = totalSiswaAll > 0 ? ((siswaDiBawahKKM.length / totalSiswaAll) * 100).toFixed(1) : '0.0';

  // Kalkulasi Umpan Balik untuk Widget Depan
  const ubData = dashboardData['umpan_balik'] || [];
  let lancarCount = 0;
  let lanjutCount = 0;
  let mudahCount = 0;
  let totalLanjutResponden = 0;
  let totalMudahResponden = 0;

  ubData.forEach(row => {
    // 1. Kelancaran (Skor 4 & 5 dianggap lancar)
    const kelancaran = String(row.kelancaran || row["Apakah aplikasi berjalan lancar selama ujian berlangsung?"] || '').trim();
    if (['4','5'].includes(kelancaran) || kelancaran.toLowerCase().includes('lancar') || kelancaran.toLowerCase().includes('ya')) {
      lancarCount++;
    }
    
    // 2. Setuju Lanjut
    const lanjut = String(row.lanjut_exambro || row["Untuk kedepannya, apakah pelaksanaan STS sebaiknya tetap menggunakan aplikasi Exambro? "] || row["Untuk kedepannya, apakah pelaksanaan STS sebaiknya tetap menggunakan aplikasi Exambro?"] || '').toLowerCase();
    if (lanjut && lanjut !== '-' && lanjut !== 'null') {
      totalLanjutResponden++;
      if (lanjut.includes('ya') || lanjut.includes('tetap') || lanjut.includes('setuju')) {
        lanjutCount++;
      }
    }

    // 3. Kemudahan Penggunaan (Skor 4 & 5 dianggap mudah)
    const kemudahan = String(row.kemudahan || row["Seberapa mudah penggunaan aplikasi Exambro saat ujian?"] || '').trim();
    if (kemudahan && kemudahan !== '-' && kemudahan !== 'null') {
      totalMudahResponden++;
      if (['4','5'].includes(kemudahan) || kemudahan.toLowerCase().includes('mudah') || kemudahan.toLowerCase().includes('gampang')) {
        mudahCount++;
      }
    }
  });

  const persenLancarUB = ubData.length > 0 ? ((lancarCount / ubData.length) * 100).toFixed(1) : '0.0';
  const persenLanjutUB = totalLanjutResponden > 0 ? ((lanjutCount / totalLanjutResponden) * 100).toFixed(1) : '0.0';
  const persenMudahUB = totalMudahResponden > 0 ? ((mudahCount / totalMudahResponden) * 100).toFixed(1) : '0.0';

  const subjectsList = [
    { key: 'agm', name: 'Pendidikan Agama' },
    { key: 'pp', name: 'Pendidikan Pancasila (PP)' },
    { key: 'b_ind', name: 'Bahasa Indonesia' },
    { key: 'mtk', name: 'Matematika' },
    { key: 'ipa', name: 'IPA' },
    { key: 'ips', name: 'IPS' },
    { key: 'b_ing', name: 'Bahasa Inggris' },
    { key: 'sbp', name: 'Seni Budaya (SBP)' },
    { key: 'pjok', name: 'PJOK' },
    { key: 'mulok', name: 'Muatan Lokal' },
    { key: 'tik', name: 'Informatika / TIK' },
    { key: 'bk', name: 'Bimbingan Konseling' },
    { key: 'koding', name: 'Koding & Pemrograman' }
  ];

  const getSubjectScore = (row: any, subjKey: string) => {
    let val = 0;
    if (subjKey === 'agm') val = row.agm ?? row.Agm ?? 0;
    else if (subjKey === 'pp') val = row.pp ?? row.PP ?? row['P.Panca'] ?? row['P.Pancasila'] ?? row['P. Pancasila'] ?? row.pkn ?? row.PKn ?? 0;
    else if (subjKey === 'b_ind') val = row.b_ind ?? row['B.Ind'] ?? row['B.INDO'] ?? 0;
    else if (subjKey === 'mtk') val = row.mtk ?? row.Mtk ?? row.MTK ?? 0;
    else if (subjKey === 'ipa') val = row.ipa ?? row.IPA ?? 0;
    else if (subjKey === 'ips') val = row.ips ?? row.IPS ?? 0;
    else if (subjKey === 'b_ing') val = row.b_ing ?? row['B.ING'] ?? row['B.Ing'] ?? 0;
    else if (subjKey === 'sbp') val = row.sbp ?? row.SBP ?? row.sb ?? row.SB ?? row['SENI BUD'] ?? 0;
    else if (subjKey === 'pjok') val = row.pjok ?? row.PJOK ?? 0;
    else if (subjKey === 'mulok') val = row.mulok ?? row.Mulok ?? row.MULOK ?? 0;
    else if (subjKey === 'tik') val = row.tik ?? row.Tik ?? row.TIK ?? 0;
    else if (subjKey === 'bk') val = row.bk ?? row.BK ?? 0;
    else if (subjKey === 'koding') val = row.koding ?? row.KODING ?? row.Koding ?? 0;
    
    const num = parseFloat(String(val));
    return isNaN(num) ? 0 : num;
  };

  const getSubjectAveragesForGrade = (gradeKey: string) => {
    const students = getJmlSiswaGrade(gradeKey);
    return subjectsList.map(subj => {
      const scores = students.map(s => getSubjectScore(s, subj.key)).filter(n => n > 0);
      const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      return {
        key: subj.key,
        name: subj.name,
        score: Number(avg.toFixed(1))
      };
    }).filter(item => item.score > 0);
  };

  const getHighestPerSubject = (students: any[]) => {
    return subjectsList.map(subj => {
      let candidateStudents: any[] = [];
      let maxScore = -1;
      
      students.forEach(s => {
        const score = getSubjectScore(s, subj.key);
        if (score > maxScore) {
          maxScore = score;
          candidateStudents = [s];
        } else if (score === maxScore && maxScore > 0) {
          candidateStudents.push(s);
        }
      });

      let selectedStudent = null;
      if (candidateStudents.length > 0) {
        candidateStudents.sort((a, b) => getRataRata(b) - getRataRata(a));
        selectedStudent = candidateStudents[0];
      }

      return {
        mapel: subj.name,
        nama: selectedStudent ? getNama(selectedStudent) : '-',
        kelas: selectedStudent ? getKelas(selectedStudent) : '-',
        jk: selectedStudent ? getJK(selectedStudent) : '-',
        nilai: maxScore > 0 ? maxScore : 0
      };
    });
  };

  const getLowestPerSubject = (students: any[]) => {
    return subjectsList.map(subj => {
      let candidateStudents: any[] = [];
      let minScore = 9999;
      
      students.forEach(s => {
        const score = getSubjectScore(s, subj.key);
        if (score > 0 && score < minScore) {
          minScore = score;
          candidateStudents = [s];
        } else if (score === minScore && minScore < 9999) {
          candidateStudents.push(s);
        }
      });

      let selectedStudent = null;
      if (candidateStudents.length > 0) {
        candidateStudents.sort((a, b) => getRataRata(a) - getRataRata(b));
        selectedStudent = candidateStudents[0];
      }

      return {
        mapel: subj.name,
        nama: selectedStudent ? getNama(selectedStudent) : '-',
        kelas: selectedStudent ? getKelas(selectedStudent) : '-',
        jk: selectedStudent ? getJK(selectedStudent) : '-',
        nilai: minScore < 9999 ? minScore : 0
      };
    });
  };

  const mapelKeys = subjectsList;

  const subjectDistribution = mapelKeys.map(m => {
    const scores = getAllStudents().map(s => getSubjectScore(s, m.key)).filter(n => n > 0);
    const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    return {
      name: m.name,
      score: Number(avg.toFixed(1)),
      type: avg >= kkmValue ? 'Tuntas' : 'Perhatian',
      icon: <Zap size={16} className="text-[#00BCD4]" />
    };
  }).filter(item => item.score > 0).sort((a, b) => b.score - a.score);

  const getRemedialSubjectsForGrade = (gradeKey: string) => {
    const students = getJmlSiswaGrade(gradeKey);
    const remedialList = subjectsList.map(subj => {
      let countRemedial = 0;
      students.forEach(s => {
        const sc = getSubjectScore(s, subj.key);
        if (sc > 0 && sc < kkmValue) {
          countRemedial++;
        }
      });
      return {
        name: subj.name,
        count: countRemedial
      };
    }).sort((a, b) => b.count - a.count);
    return remedialList;
  };

  const getTopRombelsForGrade = (gradeKey: string) => {
    const students = getJmlSiswaGrade(gradeKey);
    const rombelMap: Record<string, { totalScore: number, count: number }> = {};
    students.forEach(s => {
      const rombel = String(getKelas(s)).trim();
      const rata = getRataRata(s);
      if (rombel && rombel !== '-' && rata > 0) {
        if (!rombelMap[rombel]) rombelMap[rombel] = { totalScore: 0, count: 0 };
        rombelMap[rombel].totalScore += rata;
        rombelMap[rombel].count += 1;
      }
    });

    return Object.keys(rombelMap).map(rombel => ({
      cls: rombel,
      avg: rombelMap[rombel].count ? (rombelMap[rombel].totalScore / rombelMap[rombel].count).toFixed(1) : '0'
    })).sort((a, b) => parseFloat(b.avg) - parseFloat(a.avg)).slice(0, 3);
  };

  const topRombelsClass7 = getTopRombelsForGrade('7');
  const topRombelsClass8 = getTopRombelsForGrade('8');
  const topRombelsClass9 = getTopRombelsForGrade('9');

  const aiInsightBank: Record<string, any[]> = {
    total: [
      { id: 1, category: "Pedagogi & Diferensiasi", text: "Distribusi siswa per rombongan belajar menunjukkan kestabilan rasio, memudahkan guru menerapkan pembelajaran berdiferensiasi secara efektif." },
      { id: 2, category: "Manajemen Rekapitulasi", text: "Sinkronisasi real-time dari sistem data sekolah memastikan seluruh rekapitulasi nilai Sumatif Tengah Semester (STS) valid dan transparan." },
      { id: 3, category: `Pencapaian KKM (${kkmValue})`, text: `Sebanyak ${statsAll.stsSummary.tuntasKKM} siswa berhasil melampaui KKM ${kkmValue}, mencerminkan efektivitas strategi penyampaian materi kurikulum berjalan.` }
    ],
    kelas7: [
      { id: 1, category: "Transisi Fase D", text: "Adaptasi siswa kelas 7 dari tingkat SD ke SMP berjalan sangat baik, terutama pada penguasaan modul Informatika dan Koding." },
      { id: 2, category: "Penguatan Numerasi", text: "Diperlukan pengayaan berbasis game edukasi interaktif untuk mempertajam pemahaman logika dasar algoritma." }
    ],
    kelas8: [
      { id: 1, category: "Konsolidasi Akademik", text: "Fase kelas 8 memerlukan perhatian khusus pada rumpun mata pelajaran eksakta (Matematika & IPA) untuk menjembatani gap nilai." },
      { id: 2, category: "Metode Tutor Sebaya", text: "Penerapan program tutor sebaya terbukti efektif mendongkrak ketuntasan belajar siswa pada kelompok belajar mandiri." }
    ],
    kelas9: [
      { id: 1, category: "Kesiapan Kelulusan", text: "Sebagian besar siswa kelas 9 telah melampaui KKM, menandakan tingkat kematangan akademik yang sangat optimal." },
      { id: 2, category: "Pemetaan Studi Lanjut", text: "Bimbingan konseling kelompok menjelang ujian akhir sangat krusial untuk menjaga stabilitas mental dan fokus belajar siswa." }
    ]
  };

  const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
} as any;

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: "spring", stiffness: 280, damping: 22 }
  }
} as any;

  const getDetailInfoObj = (key: string) => {
    if (key === 'kelas7') {
      const st = getGradeStats('7');
      return {
        title: "Evaluasi Akademik & Karakter Kelas 7",
        sub: "Sumber Data: Panel Admin • Fase Transisi & Penguatan Kurikulum Informatika",
        totalSiswa: st.total,
        lk: `${st.lk} Siswa`,
        pr: `${st.pr} Siswi`,
        rasioLP: st.pr > 0 ? (st.lk / st.pr).toFixed(2) + ' : 1' : '0 : 1',
        rombelCount: st.rombelCount,
        rombelStr: st.rombelStr,
        stsSummary: { rerataSTS: st.rerataSTS, tuntasKKM: st.tuntasKKM, statusSpreadsheet: "Sinkronisasi Data Real-Time" },
        catatanPengawasan: `Berdasarkan rekapitulasi nilai STS Kelas 7, rata-rata nilai mencapai ${st.rerataSTS}.`,
        rekomendasi: ["Terapkan metode pembelajaran gamifikasi interaktif.", "Intensifkan program bimbingan adaptasi lingkungan sekolah."],
        insightKey: "kelas7",
        mapelScores: subjectDistribution.slice(0, 5),
        topScores: getHighestPerSubject(getJmlSiswaGrade('7')),
        bottomScores: getLowestPerSubject(getJmlSiswaGrade('7'))
      };
    } else if (key === 'kelas8') {
      const st = getGradeStats('8');
      return {
        title: "Evaluasi Akademik & Karakter Kelas 8",
        sub: "Sumber Data: Panel Admin • Fase Konsolidasi Kompetensi Mapel",
        totalSiswa: st.total,
        lk: `${st.lk} Siswa`,
        pr: `${st.pr} Siswi`,
        rasioLP: st.pr > 0 ? (st.lk / st.pr).toFixed(2) + ' : 1' : '0 : 1',
        rombelCount: st.rombelCount,
        rombelStr: st.rombelStr,
        stsSummary: { rerataSTS: st.rerataSTS, tuntasKKM: st.tuntasKKM, statusSpreadsheet: "Sinkronisasi Data Real-Time" },
        catatanPengawasan: `Analisis nilai STS Kelas 8 menunjukkan rata-rata nilai kelas ${st.rerataSTS}.`,
        rekomendasi: ["Adakan program klinik mata pelajaran eksakta setiap Hari Jumat sore."],
        insightKey: "kelas8",
        mapelScores: subjectDistribution.slice(0, 5),
        topScores: getHighestPerSubject(getJmlSiswaGrade('8')),
        bottomScores: getLowestPerSubject(getJmlSiswaGrade('8'))
      };
    } else if (key === 'kelas9') {
      const st = getGradeStats('9');
      return {
        title: "Evaluasi Akademik & Karakter Kelas 9",
        sub: "Sumber Data: Panel Admin • Fase Persiapan Kelulusan",
        totalSiswa: st.total,
        lk: `${st.lk} Siswa`,
        pr: `${st.pr} Siswi`,
        rasioLP: st.pr > 0 ? (st.lk / st.pr).toFixed(2) + ' : 1' : '0 : 1',
        rombelCount: st.rombelCount,
        rombelStr: st.rombelStr,
        stsSummary: { rerataSTS: st.rerataSTS, tuntasKKM: st.tuntasKKM, statusSpreadsheet: "Sinkronisasi Data Real-Time" },
        catatanPengawasan: `Kelas 9 menunjukkan performa puncak dengan pencapaian rata-rata nilai ${st.rerataSTS}.`,
        rekomendasi: ["Selenggarakan tryout berkala berbasis CBT secara intensif."],
        insightKey: "kelas9",
        mapelScores: subjectDistribution.slice(0, 5),
        topScores: getHighestPerSubject(getJmlSiswaGrade('9')),
        bottomScores: getLowestPerSubject(getJmlSiswaGrade('9'))
      };
    } else {
      return {
        title: "Demografi & Rekapitulasi Data Sekolah",
        sub: "Sumber Data Utama: Panel Admin Sekolah • Tahun Ajaran 2026/2027",
        totalSiswa: totalSiswaAll,
        lk: `${statsAll.lk} Siswa`,
        pr: `${statsAll.pr} Siswi`,
        rasioLP: statsAll.rasioLP,
        rombelCount: statsAll.rombelCount,
        rombelStr: statsAll.rombelStr,
        stsSummary: statsAll.stsSummary,
        catatanPengawasan: `Berdasarkan rekapitulasi data lintas tingkat dari panel admin, total siswa aktif adalah ${totalSiswaAll} anak.`,
        rekomendasi: [
          "Pertahankan pembaruan berkala pada data mutasi siswa masuk dan keluar melalui import Excel.",
          "Optimalkan tata letak ruang kelas agar sirkulasi udara dan pencahayaan memenuhi standar kenyamanan ideal.",
          "Tingkatkan pengawasan integrasi nilai harian secara konsisten di seluruh tingkat kelas."
        ],
        insightKey: "total",
        mapelScores: subjectDistribution.slice(0, 5),
        topScores: getHighestPerSubject(getAllStudents()),
        bottomScores: getLowestPerSubject(getAllStudents())
      };
    }
  };

  // Helper Baru: Menghitung total siswa per Rombel (Sub-kelas) yang Tuntas atau Remidi secara keseluruhan (bukan per mapel)
  const getCountByRombelOnly = (students: any[], type: 'tuntas' | 'remidi') => {
    const rombelGroups: Record<string, number> = {};
    
    students.forEach(s => {
      const cls = String(getKelas(s)).trim() || '-';
      const rata = getRataRata(s);
      
      if (rata > 0) {
        if (type === 'tuntas' && rata >= kkmValue) {
          rombelGroups[cls] = (rombelGroups[cls] || 0) + 1;
        } else if (type === 'remidi' && rata < kkmValue) {
          rombelGroups[cls] = (rombelGroups[cls] || 0) + 1;
        }
      }
    });

    return Object.keys(rombelGroups)
      .map(cls => ({
        rombel: cls,
        count: rombelGroups[cls]
      }))
      .sort((a, b) => {
        // Sortir pintar agar VII.2 berada setelah VII.1
        const numA = parseInt(a.rombel.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.rombel.replace(/\D/g, '')) || 0;
        return numA - numB || a.rombel.localeCompare(b.rombel);
      });
  };

  // Helper untuk merender SVG Chart Interaktif yang Diperkecil agar Muat Grid 3 Kolom
  const renderInteractiveMapelChart = (
    dataList: { name: string; score: number }[], 
    colorHex: string, 
    gradientId: string, 
    hoveredPoint: { name: string; score: number } | null,
    setHoveredPoint: (val: { name: string; score: number } | null) => void
  ) => {
    if (!dataList || dataList.length === 0) {
      return <div className="h-full flex items-center justify-center text-[9px] text-slate-400 italic">Belum ada data</div>;
    }

    const chartWidth = 300; 
    const chartHeight = 110; 
    const paddingLeft = 20;
    const paddingRight = 10;
    const paddingTop = 15;
    const paddingBottom = 35; 

    const usableWidth = chartWidth - paddingLeft - paddingRight;
    const usableHeight = chartHeight - paddingTop - paddingBottom;

    const scores = dataList.map(d => d.score);
    const minScore = Math.max(0, Math.min(...scores) - 10);
    const maxScore = Math.min(100, Math.max(...scores) + 5);

    const points = dataList.map((item, idx) => {
      const x = paddingLeft + (idx / (dataList.length - 1 || 1)) * usableWidth;
      const y = paddingTop + usableHeight - ((item.score - minScore) / (maxScore - minScore || 1)) * usableHeight;
      return { x, y, ...item };
    });

    const pathString = points.reduce((acc, pt, idx) => {
      if (idx === 0) return `M ${pt.x} ${pt.y}`;
      const prev = points[idx - 1];
      const cpX = (prev.x + pt.x) / 2;
      return `${acc} C ${cpX} ${prev.y}, ${cpX} ${pt.y}, ${pt.x} ${pt.y}`;
    }, "");

    const areaString = `${pathString} L ${points[points.length - 1].x} ${chartHeight - paddingBottom} L ${points[0].x} ${chartHeight - paddingBottom} Z`;

    return (
      <div className="relative w-full flex-1 flex flex-col items-center justify-end min-h-0 pt-3">
        {/* Tooltip Dinamis (Menggantikan Tulisan "LIVE" di Kanan Atas saat Hover) */}
        <div className="absolute top-2 right-2 z-20 pointer-events-none">
          <AnimatePresence mode="wait">
            {hoveredPoint ? (
              <motion.div 
                key={hoveredPoint.name}
                initial={{ opacity: 0, x: 10, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 10, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className="bg-slate-900 text-white pl-2 pr-1 py-1 rounded-lg shadow-xl flex items-center gap-2 border border-slate-700"
              >
                <span className="text-[9px] font-bold tracking-wider max-w-[80px] truncate">{hoveredPoint.name}</span>
                <span className="text-xs font-black px-1.5 py-0.5 rounded-md" style={{ backgroundColor: colorHex }}>{hoveredPoint.score}</span>
              </motion.div>
            ) : (
              <motion.div 
                key="default"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-100/80 backdrop-blur-sm text-slate-500 px-2 py-1 rounded-md border border-slate-200/60 shadow-sm"
              >
                <span className="text-[9px] font-black uppercase tracking-widest">Live</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SVG Grafik */}
        <svg className="w-full h-full max-h-[160px] overflow-visible cursor-crosshair" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colorHex} stopOpacity="0.45" />
              <stop offset="100%" stopColor={colorHex} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {[0, 0.5, 1].map((ratio, i) => { 
            const yPos = paddingTop + usableHeight * ratio;
            const val = Math.round(maxScore - (maxScore - minScore) * ratio);
            return (
              <g key={i}>
                <line x1={paddingLeft} y1={yPos} x2={chartWidth - paddingRight} y2={yPos} stroke="#e2e8f0" strokeDasharray="2 2" strokeWidth="0.8" />
                <text x={paddingLeft - 4} y={yPos + 2} fontSize="6" fill="#94a3b8" textAnchor="end" fontFamily="monospace">{val}</text>
              </g>
            );
          })}

          <motion.path initial={{ opacity: 0 }} animate={{ opacity: 1 }} d={areaString} fill={`url(#${gradientId})`} />
          <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2 }} d={pathString} fill="none" stroke={colorHex} strokeWidth="1.5" strokeLinecap="round" />

          {points.map((pt, idx) => {
            const isHovered = hoveredPoint?.name === pt.name;
            return (
              <g key={idx} className="cursor-pointer" onMouseEnter={() => setHoveredPoint({ name: pt.name, score: pt.score })} onMouseLeave={() => setHoveredPoint(null)}>
                {isHovered && (
                  <>
                    {/* Ring highlight melingkari titik seperti contoh gambar */}
                    <motion.circle cx={pt.x} cy={pt.y} r={9} fill="none" stroke={colorHex} strokeWidth="2.5" animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }} transition={{ repeat: Infinity, duration: 1.5 }} />
                    <motion.circle cx={pt.x} cy={pt.y} r={14} fill={colorHex} fillOpacity="0.15" />
                  </>
                )}
                <motion.circle cx={pt.x} cy={pt.y} r={isHovered ? 4 : 2} fill="#ffffff" stroke={colorHex} strokeWidth={isHovered ? 2 : 1} whileHover={{ scale: 1.6 }} />
                
                {/* Teks Mapel (Miring di bawah grafik) */}
                <text x={pt.x} y={chartHeight - 12} fontSize="5" fill={isHovered ? colorHex : "#64748b"} textAnchor="middle" transform={`rotate(-35 ${pt.x} ${chartHeight - 12})`} className={`font-sans ${isHovered ? 'font-black' : 'font-medium'}`}>
                  {pt.name.split(' ')[0]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  // Helper untuk Pie Chart KKM dengan Pop-up 4D Interaktif Detail Saat Disentuh/Hover
  const renderKKMPieChart = () => {
    const total = siswaDiAtasKKM.length + siswaDiBawahKKM.length || 1;
    const abovePct = (siswaDiAtasKKM.length / total) * 100;
    const belowPct = (siswaDiBawahKKM.length / total) * 100;

    const radius = 40; // Diperkecil agar lebih compact
    const circumference = 2 * Math.PI * radius;
    const aboveDash = (abovePct / 100) * circumference;

    return (
      <div className="p-3 rounded-3xl bg-gradient-to-br from-teal-50/90 via-white to-sky-50/70 border border-teal-200/80 shadow-sm flex flex-col items-center justify-between relative overflow-hidden group h-full">
        {/* POP-UP 4D / CARD INTERAKTIF DETAIL SAAT DISENTUH */}
        <AnimatePresence>
          {hoveredPieSlice && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className={`absolute inset-1 z-30 rounded-2xl backdrop-blur-3xl p-3 flex flex-col justify-center text-center shadow-2xl border ${hoveredPieSlice === 'above' ? 'bg-teal-950/90 text-teal-100 border-teal-400/50' : 'bg-rose-950/90 text-rose-100 border-rose-400/50'}`}
            >
              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/20 mx-auto w-fit mb-1">
                {hoveredPieSlice === 'above' ? 'Tuntas' : 'Remidi'}
              </span>
              <span className="text-xl font-black mb-1">
                {hoveredPieSlice === 'above' ? `${abovePct.toFixed(1)}%` : `${belowPct.toFixed(1)}%`}
              </span>
              <p className="text-[10px] font-bold text-white/80">
                {hoveredPieSlice === 'above' ? `${siswaDiAtasKKM.length} Siswa` : `${siswaDiBawahKKM.length} Siswa`}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-1.5 mb-2 w-full">
          <div className="p-1 rounded-lg bg-teal-500/15 text-teal-700 shadow-2xs"><PieIcon size={12} /></div>
          <span className="text-[10px] font-black text-slate-900 tracking-wide leading-tight">Ketuntasan<br/>KKM {kkmValue}</span>
        </div>

        {/* Donut Chart Diperkecil */}
        <div className="relative w-24 h-24 flex items-center justify-center shrink-0 z-10 my-1">
          <svg className="w-full h-full transform -rotate-90 drop-shadow-sm" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#F43F5E" strokeWidth="12" className="cursor-pointer transition-all hover:stroke-[16]" strokeOpacity={hoveredPieSlice === 'below' ? 1 : 0.85} onMouseEnter={() => setHoveredPieSlice('below')} onMouseLeave={() => setHoveredPieSlice(null)} />
            <motion.circle cx="50" cy="50" r={radius} fill="transparent" stroke="#14B8A6" strokeWidth="12" strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: circumference - aboveDash }} transition={{ duration: 1.8, ease: "easeInOut" }} className="cursor-pointer transition-all hover:stroke-[16]" strokeOpacity={hoveredPieSlice === 'above' ? 1 : 0.95} onMouseEnter={() => setHoveredPieSlice('above')} onMouseLeave={() => setHoveredPieSlice(null)} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-[8px] font-extrabold uppercase text-slate-400">Total</span>
            <span className="text-xs font-black text-slate-900">{totalSiswaAll}</span>
          </div>
        </div>

        <div className="w-full flex justify-between gap-1 mt-2">
          <div className="flex items-center gap-1 bg-white/60 px-1.5 py-1 rounded-lg border border-teal-100 flex-1 justify-center">
            <span className="w-2 h-2 rounded-full bg-teal-500"></span>
            <span className="text-[8px] font-bold text-teal-800">{abovePct.toFixed(0)}%</span>
          </div>
          <div className="flex items-center gap-1 bg-white/60 px-1.5 py-1 rounded-lg border border-rose-100 flex-1 justify-center">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span className="text-[8px] font-bold text-rose-700">{belowPct.toFixed(0)}%</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="h-screen w-screen overflow-hidden flex bg-gradient-to-br from-[#E0F7FA]/80 via-[#F1F8F9]/90 to-[#E8EEF5]/80 p-3 gap-3 font-sans text-slate-700 select-none relative"
    >
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full bg-[#00BCD4]/20 blur-3xl pointer-events-none"
      />
      <motion.div 
        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.4, 0.3] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full bg-indigo-400/20 blur-3xl pointer-events-none"
      />

      {/* ================= HOVER TRIGGER ZONE & SIDEBAR SHOW/HIDE ANIMATIF ================= */}
      <div 
        className="fixed left-0 top-0 bottom-0 w-10 z-40 flex items-center"
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
      >
        <motion.aside 
          initial={{ x: -80, opacity: 0 }}
          animate={{ x: isSidebarHovered ? 0 : -70, opacity: isSidebarHovered ? 1 : 0.15 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="w-16 h-[95vh] rounded-[28px] bg-gradient-to-b from-[#00BCD4] to-[#0097A7] backdrop-blur-2xl flex flex-col items-center justify-between py-5 shadow-2xl shrink-0 border border-white/40 z-50 ml-2"
        >
          <div className="flex flex-col items-center gap-6">
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-full bg-white/25 border-2 border-white/60 flex items-center justify-center text-white shadow-inner cursor-pointer"
            >
              <User size={20} />
            </motion.div>

            <nav className="flex flex-col gap-4 text-white/80">
              {['home', 'kelas7', 'kelas8', 'kelas9', 'admin'].map((item) => {
                const icons: Record<string, React.ReactNode> = { 
                  home: <Home size={18} />, 
                  kelas7: <span className="font-black text-sm">7</span>, 
                  kelas8: <span className="font-black text-sm">8</span>, 
                  kelas9: <span className="font-black text-sm">9</span>,
                  admin: <Shield size={18} />
                };
                return (
                  <motion.button 
                    key={item}
                    whileHover={{ scale: 1.15, x: 2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
  if (item === 'admin') {
    if (isAdminAuthenticated) {
      setShowAdminPanel(true);
    } else {
      setShowLoginModal(true);
    }
  } else if (item === 'kelas7') {
    window.location.href = '/kelas7';
  } else if (item === 'kelas8') {
    window.location.href = '/kelas8';
  } else if (item === 'kelas9') {
    window.location.href = '/kelas9';
  } else {
    setActiveNav(item);
  }
}}
                    className={`p-2.5 rounded-xl transition-all cursor-pointer ${activeNav === item ? 'bg-white text-[#00BCD4] shadow-lg shadow-black/5' : 'hover:bg-white/20 hover:text-white'}`}
                    title={item === 'admin' ? "Panel Admin" : `Dashboard ${item.toUpperCase()}`}
                  >
                    {icons[item]}
                  </motion.button>
                );
              })}
              <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} className="p-2.5 rounded-xl hover:bg-white/20 hover:text-white transition-all cursor-pointer mt-4 border-t border-white/20 pt-4">
                <Menu size={18} />
              </motion.button>
            </nav>
          </div>

          <motion.button whileHover={{ scale: 1.15, rotate: -10 }} whileTap={{ scale: 0.9 }} className="p-2.5 rounded-xl text-white/80 hover:bg-white/25 hover:text-white transition-all cursor-pointer">
            <LogOut size={18} />
          </motion.button>
        </motion.aside>
      </div>

      {/* ================= KONTEN UTAMA BENTO GRID ================= */}
      <main className="flex-1 grid grid-cols-12 gap-3 min-h-0 overflow-y-auto pl-4 pr-1 z-10">
        
        {/* KOLOM 1 (KIRI) */}
        <div className="col-span-4 flex flex-col gap-3">
          
          {displaySettings.showDemografi && (
          <motion.div 
            variants={cardVariants}
            whileHover={{ y: -3, boxShadow: "0 20px 40px rgba(0,188,212,0.15)" }}
            className="bg-white/75 backdrop-blur-2xl rounded-[28px] p-5 shadow-[0_10px_35px_rgba(0,0,0,0.05)] border border-white flex flex-col justify-between transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <motion.div 
                    animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.15, 1] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                    className="p-2.5 rounded-2xl bg-[#00BCD4]/15 text-[#00BCD4] shadow-xs"
                  >
                    <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                      <Users size={20} />
                    </motion.div>
                  </motion.div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Demografi & Rekapitulasi Siswa</h3>
                    <p className="text-[10px] font-bold text-slate-400">Panel Admin Terintegrasi</p>
                  </div>
                </div>
                <motion.span 
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 border border-emerald-500/20 flex items-center gap-1.5"
                >
                  <ShieldCheck size={12} /> Live Data
                </motion.span>
              </div>

              {/* STATS UTAMA: RERATA STS & TUNTAS KKM */}
              <div className="grid grid-cols-2 gap-2 my-2">
                <div className="p-3 rounded-2xl bg-sky-50/80 border border-sky-100 flex flex-col shadow-2xs">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Rerata STS (Semua Mapel)</span>
                  <span className="text-xl font-black text-sky-700 mt-0.5">{statsAll.stsSummary.rerataSTS}</span>
                </div>
                <div className="p-3 rounded-2xl bg-teal-50/80 border border-teal-100 flex flex-col shadow-2xs">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Tuntas KKM ({kkmValue})</span>
                  <span className="text-xl font-black text-teal-700 mt-0.5">{statsAll.stsSummary.tuntasKKM}</span>
                </div>
              </div>

              <motion.div 
                whileHover={{ scale: 1.02, backgroundColor: "rgba(0, 188, 212, 0.08)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setModalData(getDetailInfoObj('total'))}
                className="my-3 p-4 rounded-2xl bg-gradient-to-r from-sky-500/10 via-teal-500/5 to-indigo-500/10 border border-sky-200/80 cursor-pointer shadow-sm group transition-all"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-black text-slate-900 group-hover:text-[#00BCD4] transition-colors">{totalSiswaAll}</p>
                      <span className="text-sm font-bold text-slate-600">Total Siswa Aktif</span>
                    </div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mt-1 flex items-center gap-1.5">
                      <FaGraduationCap className="text-[#00BCD4] text-sm animate-bounce" /> Standar KKM Aktif: {kkmValue}
                    </p>
                  </div>
                  <motion.span 
                    animate={{ x: [0, 3, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="text-xs font-bold text-[#00BCD4] bg-white/90 px-3 py-1.5 rounded-xl shadow-xs border border-sky-100 group-hover:bg-[#00BCD4] group-hover:text-white transition-all"
                  >
                    Detail Rinci →
                  </motion.span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-sky-200/50">
                  <motion.div 
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    className="p-2.5 rounded-xl bg-white/80 border border-sky-200 shadow-2xs flex items-center gap-2.5 cursor-pointer group/card"
                  >
                    <motion.div 
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ repeat: Infinity, duration: 4 }}
                      className="w-8 h-8 rounded-lg bg-sky-500/15 flex items-center justify-center text-sky-600 shrink-0 group-hover/card:bg-sky-500 group-hover/card:text-white transition-colors"
                    >
                      <User size={16} />
                    </motion.div>
                    <div>
                      <p className="text-[9px] font-bold uppercase text-slate-400">Laki-laki (L)</p>
                      <p className="text-xs font-black text-slate-800">{statsAll.lk} <span className="text-[10px] font-normal text-slate-500">({totalSiswaAll ? ((statsAll.lk/totalSiswaAll)*100).toFixed(1) : 0}%)</span></p>
                    </div>
                  </motion.div>

                  <motion.div 
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    className="p-2.5 rounded-xl bg-white/80 border border-pink-200 shadow-2xs flex items-center gap-2.5 cursor-pointer group/card"
                  >
                    <motion.div 
                      animate={{ rotate: [0, -10, 10, 0] }}
                      transition={{ repeat: Infinity, duration: 4 }}
                      className="w-8 h-8 rounded-lg bg-pink-500/15 flex items-center justify-center text-pink-600 shrink-0 group-hover/card:bg-pink-500 group-hover/card:text-white transition-colors"
                    >
                      <User size={16} />
                    </motion.div>
                    <div>
                      <p className="text-[9px] font-bold uppercase text-slate-400">Perempuan (P)</p>
                      <p className="text-xs font-black text-slate-800">{statsAll.pr} <span className="text-[10px] font-normal text-slate-500">({totalSiswaAll ? ((statsAll.pr/totalSiswaAll)*100).toFixed(1) : 0}%)</span></p>
                    </div>
                  </motion.div>
                </div>
              </motion.div>

              <div className="grid grid-cols-3 gap-2 mt-3">
                {[
                  { 
                    key: 'kelas7', 
                    label: 'Kelas 7', 
                    stats: getGradeStats('7'), 
                    icon: (
                      <motion.div
                        animate={{ y: [0, -3, 0], scale: [1, 1.2, 1], rotate: [0, -12, 12, 0] }}
                        transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                      >
                        <Zap size={14} className="text-sky-500 fill-sky-400/30" />
                      </motion.div>
                    )
                  },
                  { 
                    key: 'kelas8', 
                    label: 'Kelas 8', 
                    stats: getGradeStats('8'), 
                    icon: (
                      <motion.div
                        animate={{ y: [0, -3, 0], scale: [1, 1.18, 1], rotate: [0, 10, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut", delay: 0.3 }}
                      >
                        <BookOpen size={14} className="text-indigo-500" />
                      </motion.div>
                    )
                  },
                  { 
                    key: 'kelas9', 
                    label: 'Kelas 9', 
                    stats: getGradeStats('9'), 
                    icon: (
                      <motion.div
                        animate={{ rotate: [0, 180, 360], scale: [1, 1.25, 1] }}
                        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 0.6 }}
                      >
                        <Sparkles size={14} className="text-purple-500" />
                      </motion.div>
                    )
                  },
                ].map((cls) => (
                  <motion.div 
                    key={cls.key}
                    whileHover={{ y: -4, scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setModalData(getDetailInfoObj(cls.key))}
                    className="p-3 rounded-2xl bg-sky-50/90 border border-sky-100 flex flex-col items-center text-center shadow-xs cursor-pointer hover:bg-sky-100 transition-all group"
                  >
                    <motion.div 
                      whileHover={{ rotate: 15, scale: 1.15 }}
                      className="p-1.5 rounded-xl bg-white shadow-xs mb-1 group-hover:shadow-md transition-all"
                    >
                      {cls.icon}
                    </motion.div>
                    <span className="text-[10px] font-bold uppercase text-slate-500">{cls.label}</span>
                    <span className="text-base font-black text-slate-900 my-0.5">{cls.stats.total}</span>
                    <span className="text-[9px] font-bold text-sky-700 bg-white px-2 py-0.5 rounded-full shadow-2xs border border-sky-200">{cls.stats.rombelCount} Rombel</span>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="mt-4 p-3 rounded-2xl bg-sky-50/90 border border-sky-100 flex items-start gap-2.5 shadow-2xs">
              <motion.div animate={{ rotate: [0, 360] }} transition={{ repeat: Infinity, duration: 10, ease: "linear" }}>
                <ShieldCheck size={18} className="text-[#00BCD4] shrink-0 mt-0.5" />
              </motion.div>
              <p className="text-[11px] leading-relaxed text-slate-700"><b>Informasi Sistem:</b> Data di atas disinkronkan langsung dari file Excel yang diunggah melalui Panel Admin.</p>
            </div>
          </motion.div>
          )}

          {/* ================= ZONA KRITIS & TUNTAS (COMPACT SLIDER STYLE & BISA DIKLIK GARISNYA) ================= */}
          {displaySettings.showZonaPerhatian && (
          <motion.div 
            variants={cardVariants}
            className="bg-white/75 backdrop-blur-2xl rounded-[28px] p-4 shadow-sm border border-white flex flex-col justify-between transition-all shrink-0"
          >
            <div className="flex items-center gap-2 mb-3 shrink-0">
              <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-500 shadow-xs">
                <AlertTriangle size={12} />
              </div>
              <h3 className="text-[10px] font-black text-slate-800">Zona Kritis & Tuntas ({kkmValue})</h3>
            </div>
            
            {/* TEXT STATS HORIZONTAL & KLIKABEL */}
            <div className="flex justify-between items-end mb-2">
                 {/* Setengah Kiri (Tuntas) -> Di Klik */}
                 <motion.div 
                   whileHover={{ scale: 1.05 }} 
                   whileTap={{ scale: 0.95 }}
                   onClick={() => setScoreModal({ type: 'tuntas', title: `Rincian Jumlah Siswa Tuntas (\u2265 KKM ${kkmValue})`, data: [] })}
                   className="flex flex-col cursor-pointer group"
                 >
                    <span className="text-2xl font-black text-emerald-500 leading-none group-hover:text-emerald-600 transition-colors">{tuntasAllPercent}%</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1 group-hover:text-emerald-500 transition-colors flex items-center gap-1">Tuntas ({siswaDiAtasKKM.length})</span>
                 </motion.div>
                 
                 {/* Setengah Kanan (Remidi) -> Di Klik */}
                 <motion.div 
                   whileHover={{ scale: 1.05 }} 
                   whileTap={{ scale: 0.95 }}
                   onClick={() => setScoreModal({ type: 'remidi', title: `Rincian Jumlah Siswa Remedial (< KKM ${kkmValue})`, data: [] })}
                   className="flex flex-col items-end cursor-pointer group"
                 >
                    <span className="text-2xl font-black text-rose-500 leading-none group-hover:text-rose-600 transition-colors">{persentaseZonaPerhatian}%</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1 group-hover:text-rose-500 transition-colors flex items-center gap-1">Remidi ({siswaDiBawahKKM.length})</span>
                 </motion.div>
            </div>

            {/* BAR ANIMASI (BISA DIKLIK GARISNYA) */}
            <div className="w-full h-3 bg-slate-100 rounded-full flex overflow-hidden shadow-inner p-[1.5px] gap-1 shrink-0 mt-auto">
               <motion.div 
                 initial={{ width: 0 }} 
                 animate={{ width: `${tuntasAllPercent}%` }} 
                 transition={{ duration: 1.2, type: "spring", bounce: 0.2 }}
                 whileHover={{ scaleY: 1.3, filter: "brightness(1.1)" }}
                 onClick={() => setScoreModal({ type: 'tuntas', title: `Rincian Jumlah Siswa Tuntas (\u2265 KKM ${kkmValue})`, data: [] })}
                 className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full shadow-sm relative overflow-hidden cursor-pointer"
               >
                  <motion.div animate={{ x: ['-100%', '200%'] }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 pointer-events-none" />
               </motion.div>
               <motion.div 
                 initial={{ width: 0 }} 
                 animate={{ width: `${persentaseZonaPerhatian}%` }} 
                 transition={{ duration: 1.2, type: "spring", bounce: 0.2, delay: 0.2 }}
                 whileHover={{ scaleY: 1.3, filter: "brightness(1.1)" }}
                 onClick={() => setScoreModal({ type: 'remidi', title: `Rincian Jumlah Siswa Remedial (< KKM ${kkmValue})`, data: [] })}
                 className="h-full bg-gradient-to-r from-orange-400 to-rose-500 rounded-full shadow-sm cursor-pointer"
               />
            </div>
          </motion.div>
          )}

          {/* CARD 3 SEKAT: JUMLAH SISWA REMEDIAL PER MAPEL PER TINGKAT KELAS 7, 8, 9 */}
          <motion.div 
            variants={cardVariants}
            whileHover={{ y: -3, boxShadow: "0 15px 35px rgba(244,63,94,0.1)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setScoreModal({
              type: 'all_remedial',
              title: `Daftar Lengkap Peringkat Remedial (< KKM ${kkmValue})`,
              data: [] 
            })}
            className="bg-white/75 backdrop-blur-2xl rounded-[28px] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white flex flex-col gap-3 transition-all cursor-pointer group shrink-0"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-500/15 text-rose-600 shadow-xs group-hover:bg-rose-500 group-hover:text-white transition-colors">
                  <AlertTriangle size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-800">Peringkat Mapel Banyak Remedial (&lt; KKM {kkmValue})</h3>
                  <p className="text-[9px] text-slate-400">Klik untuk melihat seluruh daftar mapel</p>
                </div>
              </div>
              <span className="text-[8px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 opacity-0 group-hover:opacity-100 transition-opacity">
                Lihat Lengkap →
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pointer-events-none">
              {[
                { title: 'Kelas 7', list: getRemedialSubjectsForGrade('7').slice(0, 3), border: 'border-sky-200', bg: 'bg-sky-50/50' },
                { title: 'Kelas 8', list: getRemedialSubjectsForGrade('8').slice(0, 3), border: 'border-indigo-200', bg: 'bg-indigo-50/50' },
                { title: 'Kelas 9', list: getRemedialSubjectsForGrade('9').slice(0, 3), border: 'border-purple-200', bg: 'bg-purple-50/50' },
              ].map((sec, sIdx) => (
                <div key={sIdx} className={`p-2.5 rounded-2xl ${sec.bg} border ${sec.border} flex flex-col gap-1.5`}>
                  <span className="text-[9px] font-black uppercase text-slate-800 text-center pb-1 border-b border-slate-200/60">{sec.title}</span>
                  <div className="flex flex-col gap-1">
                    {sec.list.length === 0 ? (
                      <span className="text-[8px] text-slate-400 text-center py-2">Belum ada data</span>
                    ) : (
                      sec.list.map((mItem, mIdx) => (
                        <div key={mIdx} className="flex justify-between items-center text-[9px] bg-white/80 px-2 py-1 rounded-lg shadow-2xs border border-slate-100">
                          <span className="font-semibold text-slate-700 truncate max-w-[70px]">{mItem.name}</span>
                          <span className="font-mono font-bold text-rose-600">{mItem.count} Siswa</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* KOLOM 2 (TENGAH) */}
        <div className="col-span-4 flex flex-col gap-3">
          
          {displaySettings.showCapaian && (
          <motion.div 
            variants={cardVariants}
            whileHover={{ y: -3, boxShadow: "0 15px 35px rgba(168,85,247,0.12)" }}
            className="bg-white/75 backdrop-blur-2xl rounded-[28px] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white flex flex-col justify-between transition-all"
          >
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <motion.div 
                  animate={{ y: [0, -3, 0] }} 
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="p-2 rounded-xl bg-purple-500/15 text-purple-500 shadow-xs"
                >
                  <TrendingUp size={16} />
                </motion.div>
                <div>
                  <h3 className="text-xs font-black text-slate-800">Capaian Akademik STS per Tingkat</h3>
                  <p className="text-[9px] text-slate-400">Rata-rata nilai & ketuntasan KKM ({kkmValue})</p>
                </div>
              </div>
              <span className="text-[9px] font-black px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-600 border border-purple-500/20 flex items-center gap-1">
                <FaChartLine /> KKM {kkmValue} Standar
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5 my-1">
              {[
                { key: 'kelas7', label: 'Kelas VII', stats: getGradeStats('7'), delay: 0 },
                { key: 'kelas8', label: 'Kelas VIII', stats: getGradeStats('8'), delay: 0.3 },
                { key: 'kelas9', label: 'Kelas IX', stats: getGradeStats('9'), delay: 0.6 },
              ].map((item) => (
                <motion.div 
                  key={item.key}
                  whileHover={{ y: -3, scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setModalData(getDetailInfoObj(item.key))}
                  className="p-3 rounded-2xl bg-sky-50/80 border border-sky-100 flex flex-col justify-between cursor-pointer hover:bg-sky-100 transition-all shadow-xs"
                >
                  <span className="text-[9px] font-bold uppercase text-slate-500 flex items-center gap-1">
                    <motion.span
                      animate={{ y: [0, -2.5, 0], rotate: [0, -8, 8, 0] }}
                      transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut", delay: item.delay }}
                      className="inline-flex"
                    >
                      <School size={11} className="text-sky-500" />
                    </motion.span>
                    {item.label}
                  </span>
                  <div className="my-1">
                    <p className="text-lg font-black text-sky-600">{item.stats.rerataSTS}</p>
                    <span className="text-[8px] font-bold text-slate-400 block">Rerata STS</span>
                  </div>
                  <span className="text-[8px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md w-fit border border-emerald-200 mt-1">Tuntas {item.stats.tuntasKKM}</span>
                </motion.div>
              ))}
            </div>
            <p className="text-[9px] text-slate-500 mt-2"><b>Analisis Sistem:</b> Evaluasi pencapaian nilai rata-rata per tingkat terhadap batas KKM {kkmValue}.</p>
          </motion.div>
          )}

          {/* ================= PODIUM APRESIASI ROMBEL TERBAIK ================= */}
          {displaySettings.showPodium && (
          <motion.div 
            variants={cardVariants}
            whileHover={{ y: -3, boxShadow: "0 15px 35px rgba(245,158,11,0.12)" }}
            className="bg-white/75 backdrop-blur-2xl rounded-[28px] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white flex-1 flex flex-col transition-all overflow-hidden"
          >
            <div className="flex items-center gap-3 mb-4 shrink-0">
              <motion.div 
                animate={{ rotate: [0, 15, -15, 0] }} 
                transition={{ repeat: Infinity, duration: 3 }}
                className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-400/20 to-orange-400/20 text-amber-500 shadow-sm border border-amber-100"
              >
                <Award size={18} />
              </motion.div>
              <div>
                <h3 className="text-sm font-black text-slate-800">Podium & Apresiasi Rombel Terbaik per Tingkat</h3>
                <p className="text-[10px] text-slate-500 font-medium">Podium animatif seamless gaya glassmorphism</p>
              </div>
            </div>
            
            {/* TIGA PODIUM VERTIKAL (KELAS 7, 8, 9) KAYA VISUAL & ANIMATIF */}
            <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-5 relative z-10 min-h-0 pb-2">
              {[
                { title: 'KELAS 7', list: topRombelsClass7 },
                { title: 'KELAS 8', list: topRombelsClass8 },
                { title: 'KELAS 9', list: topRombelsClass9 },
              ].map((sec, sIdx) => {
                // Fallback aman untuk mengatasi nilai kosong
                const rank1 = sec.list[0] || { cls: '-', avg: '0.0' };
                const rank2 = sec.list[1] || { cls: '-', avg: '0.0' };
                const rank3 = sec.list[2] || { cls: '-', avg: '0.0' };

                return (
                  <motion.div 
                    key={sIdx} 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: sIdx * 0.2, type: "spring", stiffness: 200, damping: 20 }}
                    className="flex flex-col gap-1.5 shrink-0 relative"
                  >
                    {/* Hiasan Latar Siluet */}
                    <div className="absolute inset-0 top-6 bottom-0 bg-gradient-to-t from-slate-100/50 to-transparent rounded-2xl pointer-events-none -z-10 blur-sm"></div>

                    <div className="flex items-center justify-center gap-4 w-full px-4">
                       <div className="h-[2px] rounded-full bg-gradient-to-r from-transparent to-slate-200 flex-1"></div>
                       <span className="text-[11px] font-black text-slate-700 tracking-widest px-2 py-0.5 bg-white/60 rounded-full shadow-sm border border-white">{sec.title}</span>
                       <div className="h-[2px] rounded-full bg-gradient-to-l from-transparent to-slate-200 flex-1"></div>
                    </div>
                    
                    {/* Wadah Podium */}
                    <div className="flex items-end justify-center gap-3 pt-3 h-[140px] w-full px-2 relative">
                      
                      {/* JUARA 2 (Perak) */}
                      <motion.div 
                        whileHover={{ y: -6, scale: 1.05 }} 
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        className="flex flex-col items-center justify-end h-full w-[30%] max-w-[140px] group cursor-pointer relative z-10"
                      >
                        <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }} className="w-5 h-5 rounded-full bg-gradient-to-br from-slate-100 to-slate-300 border-2 border-white text-slate-700 text-[10px] font-black flex items-center justify-center shadow-lg mb-1.5 relative">
                            2
                            <div className="absolute inset-0 rounded-full bg-white/40 blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </motion.div>
                        {/* Tinggi diatur ke h-[60px] */}
                        <div className="w-full h-[60px] rounded-[16px] bg-gradient-to-t from-slate-300/80 to-slate-100/60 backdrop-blur-xl border border-white flex flex-col items-center justify-center shadow-[0_10px_20px_rgba(148,163,184,0.2)] relative overflow-hidden group-hover:from-slate-300 group-hover:to-slate-50 transition-all">
                          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] duration-700"></div>
                          <span className="text-[11px] font-black text-slate-800 w-full text-center drop-shadow-sm leading-tight mb-1">{String(rank2.cls)}</span>
                          <span className="text-[9px] font-black text-slate-600 bg-white/90 px-2 py-0.5 rounded shadow-sm leading-none">{String(rank2.avg)}</span>
                        </div>
                      </motion.div>

                      {/* JUARA 1 (Emas - Paling Tinggi) */}
                      <motion.div 
                        whileHover={{ y: -8, scale: 1.05 }} 
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        className="flex flex-col items-center justify-end h-full w-[40%] max-w-[180px] z-30 group cursor-pointer"
                      >
                        <div className="relative mb-1.5 flex flex-col items-center">
                          <motion.div 
                             animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.1, 1] }} 
                             transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} 
                             className="mb-0.5"
                          >
                             <Crown size={18} className="text-amber-500 drop-shadow-[0_2px_4px_rgba(245,158,11,0.5)] fill-amber-400" />
                          </motion.div>
                          <motion.div 
                             animate={{ boxShadow: ["0px 0px 0px rgba(251,191,36,0)", "0px 0px 15px rgba(251,191,36,0.5)", "0px 0px 0px rgba(251,191,36,0)"] }}
                             transition={{ repeat: Infinity, duration: 2 }}
                             className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500 border-[3px] border-white text-white text-sm font-black flex items-center justify-center shadow-lg relative"
                          >
                            1
                            <div className="absolute inset-0 rounded-full bg-white/30 blur-[2px]"></div>
                          </motion.div>
                        </div>
                        
                        {/* Tinggi diatur ke h-[80px] */}
                        <div className="w-full h-[80px] rounded-[20px] bg-gradient-to-t from-orange-400 via-amber-400 to-yellow-300 backdrop-blur-2xl border border-white/90 flex flex-col items-center justify-center shadow-[0_15px_30px_rgba(245,158,11,0.3)] relative overflow-hidden group-hover:brightness-110 transition-all">
                          <motion.div animate={{ x: ['-200%', '200%'] }} transition={{ repeat: Infinity, duration: 3, ease: "linear" }} className="absolute inset-0 w-[40%] bg-gradient-to-r from-transparent via-white/60 to-transparent skew-x-12"></motion.div>
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"><Sparkles size={10} className="text-white animate-pulse" /></div>
                          <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"><Star size={8} className="text-white/80 animate-spin-slow fill-white/50" /></div>

                          <span className="text-[13px] font-black text-white w-full text-center drop-shadow-md leading-tight mb-1 z-10">{String(rank1.cls)}</span>
                          <span className="text-[11px] font-black text-amber-900 bg-white/95 px-2.5 py-1 rounded-md shadow-md leading-none z-10">{String(rank1.avg)}</span>
                        </div>
                      </motion.div>

                      {/* JUARA 3 (Perunggu) */}
                      <motion.div 
                        whileHover={{ y: -6, scale: 1.05 }} 
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        className="flex flex-col items-center justify-end h-full w-[30%] max-w-[140px] group cursor-pointer relative z-10"
                      >
                        <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 3, delay: 0.5, ease: "easeInOut" }} className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-200 to-orange-300 border-2 border-white text-orange-800 text-[10px] font-black flex items-center justify-center shadow-lg mb-1.5 relative">
                            3
                            <div className="absolute inset-0 rounded-full bg-white/40 blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </motion.div>
                        {/* Tinggi diatur ke h-[50px] */}
                        <div className="w-full h-[50px] rounded-[16px] bg-gradient-to-t from-orange-200/80 to-orange-100/50 backdrop-blur-md border border-white flex flex-col items-center justify-center shadow-[0_10px_20px_rgba(251,146,60,0.15)] relative overflow-hidden group-hover:from-orange-300/90 group-hover:to-orange-50 transition-all">
                          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] duration-700"></div>
                          <span className="text-[11px] font-black text-slate-800 w-full text-center drop-shadow-sm leading-tight mb-1">{String(rank3.cls)}</span>
                          <span className="text-[9px] font-bold text-slate-700 bg-white/90 px-2 py-0.5 rounded shadow-sm leading-none">{String(rank3.avg)}</span>
                        </div>
                      </motion.div>

                    </div>
                  </motion.div>
                );
              })}
            </div>
            
            <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-1 shrink-0">
               <p className="text-[9px] text-slate-500 font-medium w-full truncate"><b>Motivasi:</b> Menumbuhkan iklim kompetisi positif antar rombongan belajar di setiap tingkat.</p>
               <div className="flex gap-1">
                  <span className="w-4 h-1.5 rounded-full bg-sky-400"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
               </div>
            </div>
          </motion.div>
          )}

        </div>

       {/* ================= KOLOM 3 (KANAN) - ANALISIS UMPAN BALIK & GRAFIK RERATA ================= */}
        <div className="col-span-4 flex flex-col gap-3 h-full min-h-0">
          
          {displaySettings.showSebaran && (
          <motion.div 
            variants={cardVariants}
            whileHover={{ y: -3, boxShadow: "0 15px 35px rgba(0,188,212,0.15)" }}
            className="bg-white/85 backdrop-blur-3xl rounded-[28px] p-4 shadow-[0_10px_35px_rgba(0,0,0,0.06)] border border-white h-full flex flex-col justify-between transition-all min-h-0"
          >
            <div className="flex flex-col gap-3 h-full min-h-0">
              
              {/* CARD FULL WIDTH ANALISIS UMPAN BALIK EXAMBRO (DI ATAS) */}
              <div 
                className="w-full rounded-[20px] bg-gradient-to-r from-violet-50/90 via-white to-fuchsia-50/70 border border-violet-200/80 shadow-sm flex flex-col justify-between relative overflow-hidden shrink-0 cursor-pointer group" 
                onClick={() => { if(isAdminAuthenticated) { setShowAdminPanel(true); } else { setShowLoginModal(true); } }}
              >
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-violet-400/10 rounded-full blur-2xl pointer-events-none"></div>

                <div className="flex items-center justify-between p-3 border-b border-violet-100/50 bg-white/40">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-violet-500/15 text-violet-700 shadow-2xs group-hover:bg-violet-600 group-hover:text-white transition-colors">
                      <MessageSquare size={14} />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-900 tracking-wide leading-tight">Analisis Umpan Balik Penggunaan Aplikasi</h3>
                      <p className="text-[9px] font-bold text-slate-500">Hasil survei kepuasan siswa terhadap Exambro</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-violet-700 bg-violet-100/50 px-2 py-1 rounded-md border border-violet-200">
                    {ubData.length} Responden
                  </span>
                </div>

                <div className="flex items-center p-3 gap-3">
                   <div className="flex-1 bg-white/70 backdrop-blur-sm rounded-xl p-2.5 border border-white flex flex-col justify-between shadow-2xs group-hover:bg-white/90 transition-all">
                      <div className="flex justify-between items-start mb-1">
                         <span className="text-[9px] font-bold uppercase text-slate-500 max-w-[70%] leading-tight">Aplikasi Lancar</span>
                         <Activity size={16} className="text-emerald-500 opacity-80" />
                      </div>
                      <span className="text-lg font-black text-emerald-600 leading-none">{persenLancarUB}%</span>
                   </div>
                   
                   <div className="flex-1 bg-white/70 backdrop-blur-sm rounded-xl p-2.5 border border-white flex flex-col justify-between shadow-2xs group-hover:bg-white/90 transition-all">
                      <div className="flex justify-between items-start mb-1">
                         <span className="text-[9px] font-bold uppercase text-slate-500 max-w-[70%] leading-tight">Mudah Dipahami</span>
                         <Star size={16} className="text-amber-500 opacity-80" />
                      </div>
                      <span className="text-lg font-black text-amber-600 leading-none">{persenMudahUB}%</span>
                   </div>

                   <div className="flex-1 bg-white/70 backdrop-blur-sm rounded-xl p-2.5 border border-white flex flex-col justify-between shadow-2xs group-hover:bg-white/90 transition-all">
                      <div className="flex justify-between items-start mb-1">
                         <span className="text-[9px] font-bold uppercase text-slate-500 max-w-[70%] leading-tight">Setuju Lanjut</span>
                         <ThumbsUp size={16} className="text-blue-500 opacity-80" />
                      </div>
                      <span className="text-lg font-black text-blue-600 leading-none">{persenLanjutUB}%</span>
                   </div>
                </div>
              </div>

              {/* JUDUL ANALISIS KETUNTASAN & RERATA (BERADA DI TENGAH) */}
              <div className="flex items-center justify-between mb-0.5 mt-2 shrink-0">
                <div className="flex items-center gap-2">
                  <motion.div 
                    animate={{ scale: [1, 1.15, 1] }} 
                    transition={{ repeat: Infinity, duration: 2.5 }}
                    className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500/15 to-indigo-500/15 text-[#00BCD4] shadow-xs border border-sky-100"
                  >
                    <BookOpen size={16} />
                  </motion.div>
                  <h3 className="text-xs font-black text-slate-900">Analisis Ketuntasan & Rerata STS Mapel</h3>
                </div>
                <span className="text-[9px] font-black px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-700 border border-cyan-500/20 flex items-center gap-1">
                  <BarChart2 size={12} /> Live Analytics
                </span>
              </div>

              {/* 3 CARD KELAS 7, 8, 9 DIBUAT SEJAJAR VERTIKAL (DI BAWAH JUDUL) */}
              <div className="flex flex-col gap-2 flex-1 min-h-0 mt-1">
                
                {/* CARD KELAS 7 */}
                <div className="rounded-2xl bg-gradient-to-br from-sky-50/90 via-white to-cyan-50/50 border border-sky-200 shadow-xs flex flex-col relative overflow-hidden flex-1 min-h-0">
                  <div className="px-3 pt-2 flex items-center text-[9px] font-black uppercase text-sky-900 z-10 shrink-0">
                    <span>Kelas 7</span>
                  </div>
                  {renderInteractiveMapelChart(getSubjectAveragesForGrade('7'), '#0EA5E9', 'cyanLightGrad', hoveredPoint7, setHoveredPoint7)}
                </div>

                {/* CARD KELAS 8 */}
                <div className="rounded-2xl bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/50 border border-indigo-200 shadow-xs flex flex-col relative overflow-hidden flex-1 min-h-0">
                  <div className="px-3 pt-2 flex items-center text-[9px] font-black uppercase text-indigo-900 z-10 shrink-0">
                    <span>Kelas 8</span>
                  </div>
                  {renderInteractiveMapelChart(getSubjectAveragesForGrade('8'), '#6366F1', 'indigoLightGrad', hoveredPoint8, setHoveredPoint8)}
                </div>

                {/* CARD KELAS 9 */}
                <div className="rounded-2xl bg-gradient-to-br from-purple-50/90 via-white to-pink-50/50 border border-purple-200 shadow-xs flex flex-col relative overflow-hidden flex-1 min-h-0">
                  <div className="px-3 pt-2 flex items-center text-[9px] font-black uppercase text-purple-900 z-10 shrink-0">
                    <span>Kelas 9</span>
                  </div>
                  {renderInteractiveMapelChart(getSubjectAveragesForGrade('9'), '#A855F7', 'purpleLightGrad', hoveredPoint9, setHoveredPoint9)}
                </div>

              </div>
            </div>

            <div className="mt-2 p-2 rounded-xl bg-slate-50 border border-slate-100 shadow-2xs shrink-0">
              <p className="text-[8px] text-slate-500 text-center font-medium"><b>Catatan:</b> Grafik interaktif memuat rata-rata STS per Mapel. Arahkan kursor ke titik untuk detail.</p>
            </div>
          </motion.div>
          )}

        </div>
      </main>

      {/* ================= MODAL ADMIN LOGIN TERPISAH ================= */}
      <AdminLogin 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={() => {
          setShowLoginModal(false);
          setIsAdminAuthenticated(true);
          setShowAdminPanel(true);
        }}
      />

      {/* ================= MODAL ADMIN PANEL & PENGATURAN AUTO-SLIDE MYSQL ================= */}
      <AnimatePresence>
        {showAdminPanel && (
          <>
            <AdminPanel 
              isOpen={showAdminPanel}
              onClose={() => setShowAdminPanel(false)}
              displaySettings={displaySettings}
              setDisplaySettings={setDisplaySettings}
              dashboardData={dashboardData}
              setDashboardData={setDashboardData}
              isAuthenticated={true}
            />

            {/* Widget Pengaturan Waktu Auto-Slide Terintegrasi MySQL di Pojok Bawah Panel Admin */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-5 right-6 z-[9999] bg-slate-900/95 text-white px-4 py-3 rounded-2xl shadow-2xl border border-cyan-500/40 backdrop-blur-xl flex items-center gap-3"
            >
              <div className="flex items-center gap-2 pr-2 border-r border-slate-700">
                <RefreshCw size={15} className={`text-cyan-400 ${autoSlideEnabled ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-cyan-300 leading-none">Auto-Slide Layar</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">Tersimpan di MySQL</p>
                </div>
              </div>

              {/* Tombol On / Off */}
              <button
                onClick={() => saveAutoSlideToMySQL(!autoSlideEnabled, slideIntervalSec)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
                  autoSlideEnabled ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'
                }`}
              >
                {autoSlideEnabled ? 'ON' : 'OFF'}
              </button>

              {/* Input Waktu (Detik) */}
              <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                <input
                  type="number"
                  min={3}
                  max={300}
                  value={slideIntervalSec}
                  onChange={(e) => setSlideIntervalSec(Math.max(3, Number(e.target.value)))}
                  className="w-12 bg-transparent text-xs font-black text-center text-white focus:outline-none"
                />
                <span className="text-[10px] font-bold text-slate-400">detik</span>
              </div>

              {/* Tompan Simpan ke MySQL */}
              <button
                onClick={() => saveAutoSlideToMySQL(autoSlideEnabled, slideIntervalSec)}
                disabled={isSavingSlide}
                className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-md"
              >
                {isSavingSlide ? 'Menyimpan...' : 'Simpan'}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ================= MODAL / POP-UP DETAIL DATA ================= */}
      <AnimatePresence>
        {modalData && (() => {
          const avgPerRombel = modalData.rombelCount > 0 ? (modalData.totalSiswa / modalData.rombelCount).toFixed(1) : '0';
          const selisihIdeal = (Number(avgPerRombel) - 32).toFixed(1);
          const statusKapasitas = Number(selisihIdeal) === 0 
            ? "Ideal (Tepat 32 Siswa)" 
            : Number(selisihIdeal) > 0 
              ? `+${selisihIdeal} dari Ideal (Padat)` 
              : `${selisihIdeal} dari Ideal`;

          const currentInsights = aiInsightBank[modalData.insightKey] || aiInsightBank['total'];

          return (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xl flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 30, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 30, opacity: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 26 }}
                className="bg-white/75 backdrop-blur-3xl rounded-[36px] p-6 md:p-8 max-w-6xl w-full max-h-[92vh] overflow-y-auto shadow-[0_30px_90px_rgba(0,0,0,0.15)] border border-white/80 flex flex-col gap-5 relative"
              >
                <motion.div 
                  animate={{ scale: [1, 1.3, 1], rotate: [0, 180, 360] }}
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#00BCD4]/15 to-indigo-500/15 rounded-full blur-3xl pointer-events-none"
                />

                <motion.button 
                  whileHover={{ scale: 1.1, rotate: 90, backgroundColor: "rgba(255,255,255,0.8)" }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setModalData(null)}
                  className="absolute top-6 right-6 p-2.5 rounded-full bg-white/50 backdrop-blur-md text-slate-700 transition-colors cursor-pointer shadow-xs z-20 border border-white/60"
                >
                  <X size={18} />
                </motion.button>

                <div className="pr-12">
                  <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center gap-2 mb-1"
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-[#00BCD4]/10 text-[#00BCD4] border border-[#00BCD4]/20 flex items-center gap-1.5 backdrop-blur-md">
                      <Shield size={12} /> Live Data Feed Panel Admin
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">ID: SMPN01-BELITANG</span>
                  </motion.div>
                  <motion.h3 
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="text-xl md:text-2xl font-black text-slate-900 mt-1"
                  >
                    {modalData.title}
                  </motion.h3>
                  <motion.p 
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-xs font-semibold text-slate-500 mt-0.5"
                  >
                    {modalData.sub}
                  </motion.p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Total Siswa", val: `${modalData.totalSiswa} Siswa`, bg: "bg-white/50", text: "text-sky-700", border: "border-sky-100" },
                    { label: "Rombel Aktif", val: modalData.rombelStr.split('(')[0], bg: "bg-white/50", text: "text-indigo-700", border: "border-indigo-100" },
                    { label: "Rerata STS", val: modalData.stsSummary.rerataSTS, bg: "bg-white/50", text: "text-blue-700", border: "border-blue-100" },
                    { label: `Tuntas KKM (${kkmValue})`, val: modalData.stsSummary.tuntasKKM, bg: "bg-white/50", text: "text-teal-700", border: "border-teal-100" },
                  ].map((stat, i) => (
                    <motion.div 
                      key={i}
                      whileHover={{ scale: 1.02, y: -2 }}
                      className={`p-3.5 rounded-2xl ${stat.bg} backdrop-blur-xl border ${stat.border} flex flex-col shadow-2xs transition-all`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{stat.label}</span>
                      <span className={`text-base md:text-lg font-black ${stat.text} mt-1`}>{stat.val}</span>
                    </motion.div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <motion.div 
                    whileHover={{ scale: 1.01, y: -2 }}
                    className="p-4 rounded-2xl bg-white/50 backdrop-blur-xl border border-white/80 shadow-2xs flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600"><Users size={18} /></div>
                      <span className="text-xs font-black text-slate-800 uppercase tracking-wide">Jumlah Peserta Didik (L & P)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-xl bg-white/60 border border-sky-100 flex flex-col items-center justify-center text-center">
                        <span className="text-[9px] font-bold uppercase text-slate-500">Laki-laki</span>
                        <span className="text-xs md:text-sm font-black text-sky-900 mt-0.5">{modalData.lk}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/60 border border-pink-100 flex flex-col items-center justify-center text-center">
                        <span className="text-[9px] font-bold uppercase text-slate-500">Perempuan</span>
                        <span className="text-xs md:text-sm font-black text-pink-900 mt-0.5">{modalData.pr}</span>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div 
                    whileHover={{ scale: 1.01, y: -2 }}
                    className="p-4 rounded-2xl bg-white/50 backdrop-blur-xl border border-white/80 shadow-2xs flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600"><BarChart2 size={18} /></div>
                      <span className="text-xs font-black text-slate-800 uppercase tracking-wide">Rasio Peserta Didik (L : P)</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white/60 border border-teal-100 flex items-center justify-center my-auto">
                      <span className="text-xl md:text-2xl font-black font-mono text-teal-700 tracking-wider">{modalData.rasioLP}</span>
                    </div>
                  </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <motion.div 
                    whileHover={{ scale: 1.01, y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setScoreModal({
                      type: 'highest',
                      title: `Nilai Tertinggi per Mapel per Tingkat - ${modalData.title}`,
                      data: modalData.topScores || []
                    })}
                    className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-white/40 to-teal-500/5 backdrop-blur-xl border border-emerald-200/60 shadow-2xs flex flex-col justify-between cursor-pointer group transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600"><Award size={18} /></div>
                          <span className="text-xs font-black text-slate-800 uppercase tracking-wide">Nilai Tertinggi per Mapel</span>
                        </div>
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 border border-emerald-500/20 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                          Buka Tabel →
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-white/50 border border-emerald-100 flex justify-between items-center my-2">
                        <div>
                          <p className="text-[10px] font-bold uppercase text-slate-400">Kategori</p>
                          <p className="text-xs font-black text-slate-900">Tertinggi per Mata Pelajaran</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold uppercase text-slate-400">Total Mapel</p>
                          <p className="text-sm font-black font-mono text-emerald-700">{modalData.topScores?.length || 0} Mapel</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 text-center group-hover:text-emerald-800 transition-colors font-semibold">
                      Klik untuk melihat rincian nilai tertinggi setiap mata pelajaran (3 Tingkat Kelas)
                    </p>
                  </motion.div>

                  <motion.div 
                    whileHover={{ scale: 1.01, y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setScoreModal({
                      type: 'lowest',
                      title: `Nilai Terkecil per Mapel per Tingkat - ${modalData.title}`,
                      data: modalData.bottomScores || []
                    })}
                    className="p-4 rounded-2xl bg-gradient-to-br from-rose-500/10 via-white/40 to-amber-500/5 backdrop-blur-xl border border-rose-200/60 shadow-2xs flex flex-col justify-between cursor-pointer group transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-xl bg-rose-500/15 text-rose-600"><Award size={18} /></div>
                          <span className="text-xs font-black text-slate-800 uppercase tracking-wide">Nilai Terkecil per Mapel (Perhatian)</span>
                        </div>
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-700 border border-rose-500/20 group-hover:bg-rose-600 group-hover:text-white transition-all">
                          Buka Tabel →
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-white/50 border border-rose-100 flex justify-between items-center my-2">
                        <div>
                          <p className="text-[10px] font-bold uppercase text-slate-400">Kategori</p>
                          <p className="text-xs font-black text-slate-900">Nilai Terkecil / Perhatian</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold uppercase text-slate-400">Total Mapel</p>
                          <p className="text-sm font-black font-mono text-rose-700">{modalData.bottomScores?.length || 0} Mapel</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 text-center group-hover:text-rose-800 transition-colors font-semibold">
                      Klik untuk melihat rincian nilai terkecil setiap mata pelajaran (3 Tingkat Kelas)
                    </p>
                  </motion.div>
                </div>

                <motion.div 
                  whileHover={{ scale: 1.01 }}
                  className="p-4 rounded-2xl bg-white/50 backdrop-blur-xl border border-emerald-200/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 shadow-2xs"
                >
                  <span className="text-xs font-bold text-emerald-900 uppercase flex items-center gap-2">
                    <Target size={16} className="text-emerald-700" /> Rasio Rata-Rata / Rombel (Standar Ideal: 32 Siswa)
                  </span>
                  <div className="text-left md:text-right">
                    <span className="text-sm font-black text-emerald-800 block">{avgPerRombel} Siswa / Rombel</span>
                    <span className="text-[10px] font-bold text-emerald-700">{statusKapasitas}</span>
                  </div>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.01 }}
                  className="p-4 rounded-2xl bg-white/50 backdrop-blur-xl border border-sky-200/80 shadow-2xs flex flex-col gap-2"
                >
                  <span className="text-xs font-black uppercase text-sky-900 flex items-center gap-2">
                    <CheckSquare size={16} className="text-[#00BCD4]" /> Analisis Pengawasan Akademik
                  </span>
                  <p className="text-xs leading-relaxed text-slate-700">
                    {modalData.catatanPengawasan} Status Sinkronisasi: <b>{modalData.stsSummary.statusSpreadsheet}</b>.
                  </p>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.01 }}
                  className="p-4 rounded-2xl bg-white/50 backdrop-blur-xl border border-amber-200/80 shadow-2xs flex flex-col gap-2"
                >
                  <span className="text-xs font-black uppercase text-amber-900 flex items-center gap-2">
                    <Lightbulb size={16} className="text-amber-600" /> Rekomendasi Perbaikan & Saran Tindak Lanjut Pendidik
                  </span>
                  <ul className="list-disc list-inside text-xs leading-relaxed text-slate-700 space-y-1.5">
                    {modalData.rekomendasi.map((rec: string, idx: number) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.01 }}
                  className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 via-white/40 to-sky-500/10 backdrop-blur-xl border border-purple-200/60 shadow-2xs flex flex-col gap-2.5"
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-purple-900 flex items-center gap-2">
                      <Brain size={16} className="text-purple-600 animate-pulse" /> Bank AI Insight Manajerial (Kamus Pendidikan)
                    </span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-700 border border-purple-500/20 flex items-center gap-1">
                      <Edit3 size={10} /> Panel Manajemen
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2 mt-0.5 max-h-[200px] overflow-y-auto pr-1">
                    {currentInsights.map((insight: any) => (
                      <motion.div 
                        key={insight.id}
                        whileHover={{ scale: 1.01, x: 3 }}
                        className="p-3 rounded-xl bg-white/70 backdrop-blur-md border border-purple-100 shadow-2xs flex items-start gap-2.5"
                      >
                        <Cpu size={16} className="text-purple-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-[10px] font-black text-purple-900 uppercase tracking-wide">{insight.category}</p>
                          <p className="text-xs leading-relaxed text-slate-700 mt-0.5">{insight.text}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                <motion.button 
                  whileHover={{ scale: 1.01, backgroundColor: "rgba(0,188,212,0.9)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setModalData(null)}
                  className="w-full py-3.5 rounded-2xl bg-[#00BCD4]/90 backdrop-blur-md text-white text-sm font-black shadow-lg shadow-[#00BCD4]/20 transition-all cursor-pointer flex items-center justify-center gap-2 border border-white/30"
                >
                  <CheckCircle2 size={16} /> Tutup Detail Laporan & Simpan Sesi
                </motion.button>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ================= MODAL SUB-VIEW: TABEL 3 SEKAT KELAS 7, 8, 9 (GLASSMORPHISM) ================= */}
      <AnimatePresence>
        {scoreModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-slate-950/50 backdrop-blur-xl flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.85, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.85, y: 30, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 25 }}
              className="bg-white/75 backdrop-blur-3xl rounded-[36px] p-6 md:p-8 max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-[0_30px_90px_rgba(0,0,0,0.2)] border border-white/80 flex flex-col gap-4 relative"
            >
              <motion.button 
                whileHover={{ scale: 1.1, rotate: 90, backgroundColor: "rgba(255,255,255,0.8)" }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setScoreModal(null);
                  setSelectedSubjectFilter('all'); // Reset filter saat ditutup
                }}
                className="absolute top-5 right-5 p-2.5 rounded-full bg-white/50 backdrop-blur-md text-slate-700 cursor-pointer shadow-xs z-20 border border-white/60"
              >
                <X size={18} />
              </motion.button>

              <div className="shrink-0">
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full backdrop-blur-md ${['highest', 'tuntas'].includes(scoreModal.type) ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-200/60' : 'bg-rose-500/10 text-rose-700 border border-rose-200/60'}`}
                >
                  {scoreModal.type === 'highest' && 'Analisis Nilai Tertinggi per Mapel (3 Tingkat Kelas)'}
                  {scoreModal.type === 'lowest' && 'Analisis Nilai Terkecil / Perhatian per Mapel (3 Tingkat Kelas)'}
                  {scoreModal.type === 'tuntas' && 'Daftar Siswa Tuntas (\u2265 KKM) per Kelas'}
                  {scoreModal.type === 'remidi' && 'Daftar Siswa Remedial (< KKM) per Kelas'}
                  {scoreModal.type === 'all_remedial' && 'Seluruh Daftar Mata Pelajaran Rawan Remedial'}
                </motion.span>
                <motion.h3 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xl font-black text-slate-900 mt-2"
                >
                  {scoreModal.title}
                </motion.h3>
                <p className="text-xs text-slate-500">Menampilkan 3 sekat terpisah untuk Kelas 7, Kelas 8, dan Kelas 9.</p>
              </div>

              {/* FILTER MAPEL (HANYA MUNCUL DI MODE TUNTAS/REMIDI) */}
              {['tuntas', 'remidi'].includes(scoreModal.type) && (
                <div className="flex flex-wrap gap-2 shrink-0 border-b border-slate-200/60 pb-3">
                  <button
                    onClick={() => setSelectedSubjectFilter('all')}
                    className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all ${selectedSubjectFilter === 'all' ? (['highest', 'tuntas'].includes(scoreModal.type) ? 'bg-emerald-500 text-white border-emerald-600 shadow-md' : 'bg-rose-500 text-white border-rose-600 shadow-md') : 'bg-white/60 text-slate-600 border-slate-200 hover:bg-white'}`}
                  >
                    Rata-Rata Umum
                  </button>
                  {subjectsList.map(subj => (
                    <button
                      key={subj.key}
                      onClick={() => setSelectedSubjectFilter(subj.key)}
                      className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all ${selectedSubjectFilter === subj.key ? (['highest', 'tuntas'].includes(scoreModal.type) ? 'bg-emerald-500 text-white border-emerald-600 shadow-md' : 'bg-rose-500 text-white border-rose-600 shadow-md') : 'bg-white/60 text-slate-600 border-slate-200 hover:bg-white'}`}
                    >
                      {subj.name}
                    </button>
                  ))}
                </div>
              )}

              {/* KONTTAINER 3 SEKAT / CARD KELAS 7, 8, 9 (GLASSMORPHISM) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-0 flex-1 overflow-hidden">
                {(['7', '8', '9'] as const).map((gradeKey) => {
                  const gradeStudents = getJmlSiswaGrade(gradeKey);
                  let gradeDataList: any[] = [];
                  
                  const isRombelMode = ['tuntas', 'remidi'].includes(scoreModal.type);
                  const isPositive = ['highest', 'tuntas'].includes(scoreModal.type);

                  // Routing data berdasarkan tipe Modal
                  if (scoreModal.type === 'highest') {
                    gradeDataList = getHighestPerSubject(gradeStudents);
                  } else if (scoreModal.type === 'lowest') {
                    gradeDataList = getLowestPerSubject(gradeStudents);
                  } else if (scoreModal.type === 'all_remedial') {
                    // Ambil seluruh data remedial mapel yang tidak dipotong
                    gradeDataList = getRemedialSubjectsForGrade(gradeKey);
                  } else if (isRombelMode) {
                    // Logic pemfilteran langsung di dalam blok render tanpa memanggil fungsi external bersarang
                    const rombelGroups: Record<string, number> = {};
                    
                    gradeStudents.forEach(s => {
                      const cls = String(getKelas(s)).trim() || '-';
                      
                      if (selectedSubjectFilter === 'all') {
                        // Jika "Rata-Rata Umum"
                        const rata = getRataRata(s);
                        if (rata > 0) {
                          if (scoreModal.type === 'tuntas' && rata >= kkmValue) rombelGroups[cls] = (rombelGroups[cls] || 0) + 1;
                          else if (scoreModal.type === 'remidi' && rata < kkmValue) rombelGroups[cls] = (rombelGroups[cls] || 0) + 1;
                        }
                      } else {
                        // Jika mapel tertentu dipilih
                        const score = getSubjectScore(s, selectedSubjectFilter);
                        if (score > 0) {
                          if (scoreModal.type === 'tuntas' && score >= kkmValue) rombelGroups[cls] = (rombelGroups[cls] || 0) + 1;
                          else if (scoreModal.type === 'remidi' && score < kkmValue) rombelGroups[cls] = (rombelGroups[cls] || 0) + 1;
                        }
                      }
                    });

                    gradeDataList = Object.keys(rombelGroups)
                      .map(cls => ({ rombel: cls, count: rombelGroups[cls] }))
                      .sort((a, b) => {
                        const numA = parseInt(a.rombel.replace(/\D/g, '')) || 0;
                        const numB = parseInt(b.rombel.replace(/\D/g, '')) || 0;
                        return numA - numB || a.rombel.localeCompare(b.rombel);
                      });
                  }

                  return (
                    <motion.div 
                      key={gradeKey}
                      whileHover={{ y: -2, backgroundColor: "rgba(255,255,255,0.7)" }}
                      className="bg-white/50 backdrop-blur-xl rounded-2xl border border-white/80 p-4 shadow-xs flex flex-col transition-all overflow-hidden"
                    >
                      <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200/60 shrink-0">
                        <h4 className={`text-sm font-black flex items-center gap-1.5 ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                          <School size={16} /> Kelas {gradeKey}
                        </h4>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/70 backdrop-blur-md border border-slate-200/60 text-slate-600">
                          {gradeStudents.length} Siswa Aktif
                        </span>
                      </div>

                      <div className="flex flex-col gap-2 overflow-y-auto pr-1 flex-1">
                        {/* RENDER MODE TUNTAS/REMIDI (List per Sub-Kelas/Rombel) */}
                        {isRombelMode ? (
                          <div className="flex flex-col gap-1.5">
                            {gradeDataList.map((item, i) => (
                              <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-white/60 backdrop-blur-md border border-white/80 shadow-2xs transition-all hover:bg-white/90">
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${isPositive ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
                                  <span className="text-xs font-black text-slate-800 tracking-wider">Kelas {item.rombel}</span>
                                </div>
                                <span className={`font-mono font-black text-sm bg-white px-2 py-0.5 rounded-lg shadow-2xs border ${isPositive ? 'text-emerald-600 border-emerald-100' : 'text-rose-600 border-rose-100'}`}>
                                  {item.count} Siswa
                                </span>
                              </div>
                            ))}
                            {gradeDataList.length === 0 && (
                               <p className="text-[10px] text-slate-400 italic text-center py-4">Tidak ada data untuk filter ini.</p>
                            )}
                          </div>
                        ) : (
                          /* RENDER MODE HIGHEST/LOWEST & ALL_REMEDIAL (List per Mapel) */
                          gradeDataList.map((item, i) => (
                            <div key={i} className="p-3 rounded-xl bg-white/60 backdrop-blur-md border border-white/80 shadow-2xs flex flex-col gap-1.5 transition-all hover:bg-white/90">
                              <div className="flex justify-between items-center text-[11px] font-bold border-b border-slate-100/80 pb-1.5">
                                {/* all_remedial menyimpan nama di item.name, sisanya di item.mapel */}
                                <span className="text-slate-800 truncate pr-2">{item.mapel || item.name}</span>
                                <span className={`font-mono font-black ${isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                                  {scoreModal.type === 'all_remedial' ? `${item.count} Siswa` : (item.nilai > 0 ? item.nilai : '-')}
                                </span>
                              </div>
                              
                              {/* Rincian siswa individu hanya muncul untuk highest/lowest */}
                              {scoreModal.type !== 'all_remedial' && (
                                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                                  <span className="font-semibold truncate max-w-[130px]">{item.nama}</span>
                                  <span className="font-mono font-bold bg-white/80 px-2 py-0.5 rounded-md text-slate-700 border border-slate-200/50">{item.kelas}</span>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <motion.button 
                whileHover={{ scale: 1.01, backgroundColor: "rgba(15, 23, 42, 0.9)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setScoreModal(null);
                  setSelectedSubjectFilter('all'); // Reset filter saat ditutup
                }}
                className="w-full shrink-0 py-3.5 rounded-2xl bg-slate-900/90 backdrop-blur-md text-white text-xs font-black shadow-lg cursor-pointer mt-2 flex items-center justify-center gap-2 border border-slate-700"
              >
                Kembali ke Ringkasan Laporan
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
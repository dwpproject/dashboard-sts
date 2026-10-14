"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, MessageSquare, Star, Menu, LogOut, 
  User, TrendingUp, AlertTriangle, Award, 
  Users, School, Activity, ShieldCheck, BookOpen, 
  BarChart2, Crown, Sparkles, Shield, Zap, ThumbsUp, Target, Trophy, Medal
} from 'lucide-react';
import { FaGraduationCap, FaChartLine } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

export default function DashboardKelas8() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState('kelas8');
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [kkmValue, setKkmValue] = useState(75);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [hoveredRombel, setHoveredRombel] = useState(null);
  const [rombelSort, setRombelSort] = useState('urut'); // 'urut' | 'peringkat'

  // State utama penyimpanan data Kelas 8
  const [dataKelas8, setDataKelas8] = useState([]);
  const [umpanBalikData, setUmpanBalikData] = useState([]);

  // Ref untuk mengontrol efek suara guliran agar tidak bertumpuk terlalu cepat
  const lastScrollSoundTime = useRef(0);

  // Fungsi pemutar sound effect lembut (synthesized tick)
  const playScrollSound = () => {
    try {
      const now = Date.now();
      if (now - lastScrollSoundTime.current < 70) return;
      lastScrollSoundTime.current = now;

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.03);

      gain.gain.setValueAtTime(0.015, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.03);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.03);
    } catch (e) {
      // Abaikan jika autoplay diblokir browser
    }
  };

  // Fetch data dari API saat komponen dimuat
  useEffect(() => {
    async function fetchDatabaseData() {
      try {
        const resSiswa = await fetch('/api/siswa');
        const resultSiswa = await resSiswa.json();
        
        const resUB = await fetch('/api/umpan-balik');
        const textUB = await resUB.text();
        let dataUB = [];
        if (textUB) {
           const parsedUB = JSON.parse(textUB);
           if (parsedUB.success && parsedUB.data) dataUB = parsedUB.data;
        }

        // Ambil khusus data Kelas 8
        if (resultSiswa.success && resultSiswa.data && resultSiswa.data['8']) {
          setDataKelas8(resultSiswa.data['8']);
        }
        
        // Filter Umpan Balik KHUSUS Kelas 8 yang diawali dengan "8-"
        const filteredUB = dataUB.filter((row) => {
            const cls = String(row.kelas || row.Kelas || row.KELAS || '').trim().toLowerCase();
            return cls.startsWith('8-');
        });
        setUmpanBalikData(filteredUB);

      } catch (err) {
        console.error("Gagal memuat data:", err);
      }
    }
    fetchDatabaseData();
  }, []);

  // Setelan Visibilitas (selalu true untuk Kelas 8)
  const displaySettings = {
    showDemografi: true,
    showZonaPerhatian: true,
    showCapaian: true,
    showPodium: true,
    showSebaran: true
  };

  // --- HELPER FUNCTIONS ---
  const getNama = (row) => row.nama || row.Nama || '-';
  const getKelas = (row) => row.kelas || row.Kelas || '-';
  const getJK = (row) => String(row.jk || row.JK || '').trim().toUpperCase();
  const getRataRata = (row) => {
    const val = row.rata_rata ?? row["RATA-RATA"] ?? row.RATA2 ?? row["RATA2"] ?? 0;
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
  };

  // --- KALKULASI STATISTIK KELAS 8 ---
  const totalSiswa = dataKelas8.length;
  const lk = dataKelas8.filter(s => getJK(s) === 'L').length;
  const pr = dataKelas8.filter(s => getJK(s) === 'P').length;

  const validRata = dataKelas8.map(s => getRataRata(s)).filter(v => v > 0);
  const avgRerata = validRata.length ? (validRata.reduce((a, b) => a + b, 0) / validRata.length).toFixed(1) : '0.0';
  
  const siswaTuntas = dataKelas8.filter(s => getRataRata(s) >= kkmValue && getRataRata(s) > 0);
  const siswaRemidi = dataKelas8.filter(s => getRataRata(s) > 0 && getRataRata(s) < kkmValue);
  const tuntasPersen = validRata.length ? ((siswaTuntas.length / validRata.length) * 100).toFixed(1) : '0.0';
  const remidiPersen = validRata.length ? ((siswaRemidi.length / validRata.length) * 100).toFixed(1) : '0.0';

  const rombels = Array.from(new Set(dataKelas8.map(s => String(getKelas(s)).trim()).filter(Boolean)));

  // Menghitung rata-rata siswa per rombel
  const avgPerRombel = rombels.length > 0 ? (totalSiswa / rombels.length).toFixed(1) : '0';
  const selisihIdeal = (Number(avgPerRombel) - 32).toFixed(1);
  const statusKapasitas = Number(selisihIdeal) === 0 
    ? "Ideal (Tepat 32 Siswa)" 
    : Number(selisihIdeal) > 0 
      ? `+${selisihIdeal} dari Ideal (Padat)` 
      : `${selisihIdeal} dari Ideal`;

  // --- KALKULASI RERATA NILAI STS PER KELAS (ROMBEL) KELAS 8 ---
  const baseRombelStats = rombels.map(rName => {
    const siswaDiKelas = dataKelas8.filter(s => String(getKelas(s)).trim() === rName);
    const nilaiValid = siswaDiKelas.map(s => getRataRata(s)).filter(v => v > 0);
    const avg = nilaiValid.length ? (nilaiValid.reduce((a, b) => a + b, 0) / nilaiValid.length) : 0;
    const tuntas = siswaDiKelas.filter(s => getRataRata(s) >= kkmValue && getRataRata(s) > 0).length;
    const remidi = siswaDiKelas.filter(s => getRataRata(s) > 0 && getRataRata(s) < kkmValue).length;
    const maxScore = nilaiValid.length ? Math.max(...nilaiValid) : 0;
    const minScore = nilaiValid.length ? Math.min(...nilaiValid) : 0;
    const persenTuntas = nilaiValid.length ? ((tuntas / nilaiValid.length) * 100).toFixed(1) : '0.0';

    return {
      kelas: rName,
      avg: Number(avg.toFixed(1)),
      totalSiswa: siswaDiKelas.length,
      tuntas,
      remidi,
      persenTuntas: Number(persenTuntas),
      maxScore: Number(maxScore.toFixed(1)),
      minScore: Number(minScore.toFixed(1))
    };
  });

  // Urutan peringkat untuk menentukan Juara 1, 2, 3 Rombel
  const rankedByScore = [...baseRombelStats].sort((a, b) => b.avg - a.avg);
  const rombelStats = [...baseRombelStats].map(item => ({
    ...item,
    rank: rankedByScore.findIndex(r => r.kelas === item.kelas) + 1
  })).sort((a, b) => {
    if (rombelSort === 'peringkat') return b.avg - a.avg;
    return a.kelas.localeCompare(b.kelas, undefined, { numeric: true, sensitivity: 'base' });
  });

  const activeSpotlightRombel = hoveredRombel || rankedByScore[0] || null;

  // --- KALKULASI 10 JUARA UMUM SISWA KELAS 8 ---
  const top10Students = [...dataKelas8].map(s => {
    const rata = getRataRata(s);
    const totalNilai = s.jumlah_nilai ?? s["JUMLAH-NILAI"] ?? s.TOTAL ?? (rata * 13);
    return {
      nama: getNama(s),
      kelas: getKelas(s),
      rata: rata.toFixed(1),
      jumlahNilai: Number(totalNilai).toFixed(1)
    };
  }).sort((a, b) => parseFloat(b.rata) - parseFloat(a.rata)).slice(0, 10);

  // --- KALKULASI UMPAN BALIK KELAS 8 (DIAWALI "8-") ---
  let lancarCount = 0, lanjutCount = 0, mudahCount = 0;
  let totalLanjutResponden = 0, totalMudahResponden = 0;

  umpanBalikData.forEach(row => {
    const kelancaran = String(row.kelancaran || row["Apakah aplikasi berjalan lancar selama ujian berlangsung?"] || '').trim();
    if (['4','5'].includes(kelancaran) || kelancaran.toLowerCase().includes('lancar') || kelancaran.toLowerCase().includes('ya')) lancarCount++;
    
    const lanjut = String(row.lanjut_exambro || row["Untuk kedepannya, apakah pelaksanaan STS sebaiknya tetap menggunakan aplikasi Exambro? "] || '').toLowerCase();
    if (lanjut && lanjut !== '-' && lanjut !== 'null') {
      totalLanjutResponden++;
      if (lanjut.includes('ya') || lanjut.includes('tetap') || lanjut.includes('setuju')) lanjutCount++;
    }

    const kemudahan = String(row.kemudahan || row["Seberapa mudah penggunaan aplikasi Exambro saat ujian?"] || '').trim();
    if (kemudahan && kemudahan !== '-' && kemudahan !== 'null') {
      totalMudahResponden++;
      if (['4','5'].includes(kemudahan) || kemudahan.toLowerCase().includes('mudah') || kemudahan.toLowerCase().includes('gampang')) mudahCount++;
    }
  });

  const persenLancarUB = umpanBalikData.length > 0 ? ((lancarCount / umpanBalikData.length) * 100).toFixed(1) : '0.0';
  const persenLanjutUB = totalLanjutResponden > 0 ? ((lanjutCount / totalLanjutResponden) * 100).toFixed(1) : '0.0';
  const persenMudahUB = totalMudahResponden > 0 ? ((mudahCount / totalMudahResponden) * 100).toFixed(1) : '0.0';

  // --- DAFTAR MAPEL ---
  const subjectsList = [
    { key: 'agm', name: 'Agama' }, { key: 'pp', name: 'PP' }, { key: 'b_ind', name: 'B. Ind' },
    { key: 'mtk', name: 'Mtk' }, { key: 'ipa', name: 'IPA' }, { key: 'ips', name: 'IPS' },
    { key: 'b_ing', name: 'B. Ing' }, { key: 'sbp', name: 'Seni' }, { key: 'pjok', name: 'PJOK' },
    { key: 'mulok', name: 'Mulok' }, { key: 'tik', name: 'TIK' }, { key: 'bk', name: 'BK' }, { key: 'koding', name: 'Koding' }
  ];

  const getSubjectScore = (row, subjKey) => {
    let val = 0;
    if (subjKey === 'agm') val = row.agm ?? row.Agm ?? 0;
    else if (subjKey === 'pp') val = row.pp ?? row.PP ?? row['P.Panca'] ?? row['P.Pancasila'] ?? row.pkn ?? row.PKn ?? 0;
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
    return isNaN(parseFloat(val)) ? 0 : parseFloat(val);
  };

  const mapelAverages = subjectsList.map(subj => {
    const scores = dataKelas8.map(s => getSubjectScore(s, subj.key)).filter(n => n > 0);
    const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    return { name: subj.name, score: Number(avg.toFixed(1)) };
  }).filter(item => item.score > 0);

  const remedialSubjects = subjectsList.map(subj => {
    let countRemedial = 0;
    let countTuntas = 0;
    dataKelas8.forEach(s => {
      const sc = getSubjectScore(s, subj.key);
      if (sc > 0) {
        if (sc < kkmValue) countRemedial++;
        else countTuntas++;
      }
    });
    return { name: subj.name, count: countRemedial, tuntas: countTuntas };
  }).sort((a, b) => b.count - a.count);

  // --- ANIMATION VARIANTS ---
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.08 } }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 18, scale: 0.97 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 320, damping: 24 } }
  };

  // --- KOMPONEN CHART MAPEL ---
  const renderInteractiveMapelChart = (dataList) => {
    if (!dataList || dataList.length === 0) return <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">Belum ada data mata pelajaran</div>;

    const chartWidth = 700; 
    const chartHeight = 240; 
    const paddingLeft = 30;
    const paddingRight = 30;
    const paddingTop = 20;
    const paddingBottom = 40; 

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
      <div className="relative w-full flex-1 flex flex-col items-center justify-end min-h-0 pt-4">
        <div className="absolute top-2 right-4 z-20 pointer-events-none">
          <AnimatePresence mode="wait">
            {hoveredPoint ? (
              <motion.div 
                key={hoveredPoint.name}
                initial={{ opacity: 0, x: 10, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 10, scale: 0.9 }}
                className="bg-slate-900 text-white pl-3 pr-2 py-1.5 rounded-xl shadow-xl flex items-center gap-3 border border-slate-700"
              >
                <span className="text-xs font-bold tracking-wider truncate">{hoveredPoint.name}</span>
                <span className="text-sm font-black px-2 py-1 rounded-md bg-[#0EA5E9]">{hoveredPoint.score}</span>
              </motion.div>
            ) : (
              <motion.div 
                key="default"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, y: [0, -2, 0] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                className="bg-sky-100/80 backdrop-blur-sm text-sky-600 px-3 py-1.5 rounded-lg border border-sky-200/60 shadow-sm flex items-center gap-1.5"
              >
                <Sparkles size={11} className="text-sky-500 animate-spin" style={{ animationDuration: '6s' }} />
                <span className="text-[10px] font-black uppercase tracking-widest">Live Mapel Hover</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <svg className="w-full h-full overflow-visible cursor-crosshair" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="cyanGrad8Full" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {[0, 0.5, 1].map((ratio, i) => { 
            const yPos = paddingTop + usableHeight * ratio;
            const val = Math.round(maxScore - (maxScore - minScore) * ratio);
            return (
              <g key={i}>
                <line x1={paddingLeft} y1={yPos} x2={chartWidth - paddingRight} y2={yPos} stroke="#e2e8f0" strokeDasharray="3 3" strokeWidth="1" />
                <text x={paddingLeft - 6} y={yPos + 3} fontSize="8" fill="#94a3b8" textAnchor="end" fontFamily="monospace">{val}</text>
              </g>
            );
          })}

          <motion.path initial={{ opacity: 0 }} animate={{ opacity: 1 }} d={areaString} fill={`url(#cyanGrad8Full)`} />
          <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, ease: "easeInOut" }} d={pathString} fill="none" stroke="#0EA5E9" strokeWidth="2.8" strokeLinecap="round" />

          {points.map((pt, idx) => {
            const isHovered = hoveredPoint?.name === pt.name;
            return (
              <g key={idx} className="cursor-pointer" onMouseEnter={() => { playScrollSound(); setHoveredPoint({ name: pt.name, score: pt.score }); }} onMouseLeave={() => setHoveredPoint(null)}>
                {isHovered && (
                  <>
                    <motion.circle cx={pt.x} cy={pt.y} r={12} fill="none" stroke="#0EA5E9" strokeWidth="3" animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }} transition={{ repeat: Infinity, duration: 1.5 }} />
                    <motion.circle cx={pt.x} cy={pt.y} r={18} fill="#0EA5E9" fillOpacity="0.15" />
                  </>
                )}
                <motion.circle cx={pt.x} cy={pt.y} r={isHovered ? 6 : 4} fill="#ffffff" stroke="#0EA5E9" strokeWidth={isHovered ? 3 : 2} whileHover={{ scale: 1.5 }} />
                <text x={pt.x} y={chartHeight - 12} fontSize="8" fill={isHovered ? "#0EA5E9" : "#64748b"} textAnchor="middle" transform={`rotate(-35 ${pt.x} ${chartHeight - 12})`} className={`font-sans ${isHovered ? 'font-black' : 'font-medium'}`}>
                  {pt.name.split(' ')[0]}
                </text>
              </g>
            );
          })}
        </svg>
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
      {/* AMBIENT BACKGROUND GLOW ORBS */}
      <motion.div 
        animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.55, 0.3], x: [0, 20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full bg-[#00BCD4]/20 blur-3xl pointer-events-none"
      />
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.25, 0.45, 0.25], y: [0, -20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full bg-indigo-400/20 blur-3xl pointer-events-none"
      />

      {/* ================= HOVER TRIGGER ZONE & SIDEBAR ================= */}
      <div className="fixed left-0 top-0 bottom-0 w-10 z-40 flex items-center" onMouseEnter={() => setIsSidebarHovered(true)} onMouseLeave={() => setIsSidebarHovered(false)}>
        <motion.aside 
          initial={{ x: -80, opacity: 0 }}
          animate={{ x: isSidebarHovered ? 0 : -70, opacity: isSidebarHovered ? 1 : 0.15 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="w-16 h-[95vh] rounded-[28px] bg-gradient-to-b from-[#00BCD4] to-[#0097A7] backdrop-blur-2xl flex flex-col items-center justify-between py-5 shadow-2xl shrink-0 border border-white/40 z-50 ml-2"
        >
          <div className="flex flex-col items-center gap-6">
            <motion.div whileHover={{ scale: 1.15, rotate: 8 }} whileTap={{ scale: 0.95 }} className="w-10 h-10 rounded-full bg-white/25 border-2 border-white/60 flex items-center justify-center text-white shadow-inner cursor-pointer">
              <User size={20} />
            </motion.div>
            <nav className="flex flex-col gap-4 text-white/80">
  {['home', 'kelas7', 'kelas8', 'kelas9', 'admin'].map((item) => {
    const icons = { 
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
          if (item === 'home') {
            router.push('/'); // Kembali ke Dashboard Keseluruhan (root)
          } else if (item === 'kelas7') {
            router.push('/kelas7'); // Pindah ke halaman Kelas 7
          } else if (item === 'kelas8') {
            router.push('/kelas8'); // Pindah ke halaman Kelas 8
          } else if (item === 'kelas9') {
            router.push('/kelas9'); // Pindah ke halaman Kelas 9
          } else if (item === 'admin') {
            router.push('/?openAdmin=true');
          }
        }} 
        className={`p-2.5 rounded-xl transition-all cursor-pointer ${activeNav === item ? 'bg-white text-[#00BCD4] shadow-lg shadow-black/5' : 'hover:bg-white/20 hover:text-white'}`}
      >
        {icons[item]}
      </motion.button>
    );
  })}
</nav>
          </div>
          <motion.button whileHover={{ scale: 1.15, rotate: -10 }} whileTap={{ scale: 0.9 }} className="p-2.5 rounded-xl text-white/80 hover:bg-white/25 hover:text-white transition-all cursor-pointer">
            <LogOut size={18} />
          </motion.button>
        </motion.aside>
      </div>

      {/* ================= KONTEN UTAMA BENTO GRID (FULL & COMPACT) ================= */}
      <main className="flex-1 grid grid-cols-12 gap-3 z-10 w-full mx-auto h-full grid-rows-[auto_1fr]">
        
        {/* HEADER FULL WIDTH DENGAN IKON ANIMATIF & DATA SURVEI INTERAKTIF KELAS 8 */}
        <motion.div variants={cardVariants} className="col-span-12 flex flex-wrap sm:flex-nowrap items-center justify-between bg-white/75 backdrop-blur-2xl p-3.5 px-4 rounded-[22px] border border-white shadow-sm shrink-0 relative overflow-hidden">
           <div className="flex items-center gap-3 z-10">
              <motion.div 
                animate={{ y: [0, -3, 0], rotate: [0, -5, 5, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                whileHover={{ scale: 1.15, rotate: 12 }}
                className="p-2.5 bg-gradient-to-br from-cyan-100 to-sky-200 text-cyan-700 rounded-xl shadow-xs border border-cyan-200/60 cursor-pointer"
              >
                <School size={20} />
              </motion.div>
              <div>
                 <div className="flex items-center gap-2">
                   <h1 className="text-xl font-black text-slate-900 tracking-tight">Dashboard Data STS Kelas VIII</h1>
                   <motion.span 
                     animate={{ scale: [1, 1.08, 1] }}
                     transition={{ repeat: Infinity, duration: 2.5 }}
                     className="hidden md:inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-700 border border-cyan-300/60"
                   >
                     <Zap size={10} className="fill-cyan-500 text-cyan-500" /> Real-Time
                   </motion.span>
                 </div>
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Fase D • Penilaian Sumatif Tengah Semester</p>
              </div>
           </div>

           {/* DATA UMPAN BALIK KELAS 8 (DIAWALI "8-") DI POJOK KANAN ATAS DENGAN IKON BERGERAK */}
           <div className="flex items-center gap-2 mt-2 sm:mt-0 z-10">
              <motion.div 
                whileHover={{ y: -3, scale: 1.03 }}
                onMouseEnter={playScrollSound}
                className="px-3 py-1.5 bg-white/90 rounded-xl border border-emerald-100 shadow-xs flex items-center gap-2 cursor-pointer transition-all hover:shadow-md hover:border-emerald-300"
              >
                 <motion.div 
                   animate={{ scale: [1, 1.2, 1] }} 
                   transition={{ repeat: Infinity, duration: 2 }}
                   className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600"
                 >
                   <Activity size={13} />
                 </motion.div>
                 <div>
                   <p className="text-[8px] font-bold text-slate-400 uppercase leading-none">Aplikasi Lancar</p>
                   <p className="text-sm font-black text-emerald-600 leading-none mt-1">{persenLancarUB}%</p>
                 </div>
              </motion.div>

              <motion.div 
                whileHover={{ y: -3, scale: 1.03 }}
                onMouseEnter={playScrollSound}
                className="px-3 py-1.5 bg-white/90 rounded-xl border border-amber-100 shadow-xs flex items-center gap-2 cursor-pointer transition-all hover:shadow-md hover:border-amber-300"
              >
                 <motion.div 
                   animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.15, 1] }} 
                   transition={{ repeat: Infinity, duration: 2.5 }}
                   className="p-1.5 rounded-lg bg-amber-50 text-amber-500"
                 >
                   <Star size={13} className="fill-amber-400" />
                 </motion.div>
                 <div>
                   <p className="text-[8px] font-bold text-slate-400 uppercase leading-none">Mudah Dipahami</p>
                   <p className="text-sm font-black text-amber-600 leading-none mt-1">{persenMudahUB}%</p>
                 </div>
              </motion.div>

              <motion.div 
                whileHover={{ y: -3, scale: 1.03 }}
                onMouseEnter={playScrollSound}
                className="px-3 py-1.5 bg-white/90 rounded-xl border border-blue-100 shadow-xs flex items-center gap-2 cursor-pointer transition-all hover:shadow-md hover:border-blue-300"
              >
                 <motion.div 
                   animate={{ y: [0, -2, 0], rotate: [0, -8, 0] }} 
                   transition={{ repeat: Infinity, duration: 2 }}
                   className="p-1.5 rounded-lg bg-blue-50 text-blue-600"
                 >
                   <ThumbsUp size={13} />
                 </motion.div>
                 <div>
                   <p className="text-[8px] font-bold text-slate-400 uppercase leading-none">Setuju Lanjut</p>
                   <p className="text-sm font-black text-blue-600 leading-none mt-1">{persenLanjutUB}%</p>
                 </div>
              </motion.div>

              <motion.div 
                whileHover={{ y: -3, scale: 1.03 }}
                onMouseEnter={playScrollSound}
                className="px-3 py-1.5 bg-gradient-to-br from-purple-50 to-fuchsia-50 rounded-xl border border-purple-200/80 shadow-xs flex items-center gap-2 cursor-pointer transition-all hover:shadow-md hover:border-purple-300"
              >
                 <motion.div 
                   animate={{ scale: [1, 1.15, 1] }} 
                   transition={{ repeat: Infinity, duration: 2.2 }}
                   className="p-1.5 rounded-lg bg-purple-500/15 text-purple-600"
                 >
                   <MessageSquare size={13} />
                 </motion.div>
                 <div>
                   <p className="text-[8px] font-bold text-purple-600 uppercase leading-none">Total Responden</p>
                   <p className="text-sm font-black text-purple-700 leading-none mt-1">{umpanBalikData.length} Siswa</p>
                 </div>
              </motion.div>
           </div>
        </motion.div>

        {/* CONTAINER KONTEN (3 KOLOM GRID) */}
        <div className="col-span-12 grid grid-cols-1 md:grid-cols-12 gap-3 min-h-0">
            
            {/* KOLOM 1 (KIRI) - DEMOGRAFI, ZONA KRITIS, & ANALISIS MAPEL */}
            <div className="col-span-12 lg:col-span-3 flex flex-col gap-3 min-h-0">
              
              {/* CARD DEMOGRAFI SISWA */}
              <motion.div variants={cardVariants} whileHover={{ y: -2 }} className="bg-white/80 backdrop-blur-2xl rounded-[24px] p-5 shadow-sm border border-white flex flex-col shrink-0 group transition-all hover:bg-white/95 hover:shadow-md">
                  <div className="flex items-center justify-between mb-3">
                     <div className="flex items-center gap-2">
                        <motion.div
                          animate={{ y: [0, -2, 0], scale: [1, 1.1, 1] }}
                          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                          className="p-1.5 rounded-xl bg-cyan-500/15 text-cyan-600"
                        >
                          <Users size={16} />
                        </motion.div>
                        <h3 className="text-sm font-black text-slate-800">Demografi Siswa</h3>
                     </div>
                     <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-2xs flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> Live
                     </span>
                  </div>

                  <div className="flex items-end gap-2 mb-4 mt-1">
                     <motion.h2 
                       initial={{ scale: 0.8, opacity: 0 }}
                       animate={{ scale: 1, opacity: 1 }}
                       transition={{ type: "spring", stiffness: 300 }}
                       className="text-5xl font-black text-slate-900 leading-none tracking-tight"
                     >
                       {totalSiswa}
                     </motion.h2>
                     <span className="text-xs font-bold text-slate-500 mb-1">Siswa Aktif Kelas 8</span>
                  </div>

                  <div className="flex gap-2">
                     <motion.div 
                       whileHover={{ scale: 1.03, y: -2 }}
                       onMouseEnter={playScrollSound}
                       className="flex-1 bg-gradient-to-br from-sky-50 to-cyan-50/60 p-3 rounded-xl border border-sky-100 flex flex-col items-center justify-center transition-all hover:shadow-sm cursor-pointer"
                     >
                        <span className="text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-wider">Laki-laki</span>
                        <div className="flex items-baseline gap-1">
                           <span className="text-xl font-black text-sky-700 leading-none">{lk}</span>
                           <span className="text-[10px] font-bold text-slate-400">({totalSiswa ? ((lk/totalSiswa)*100).toFixed(0) : 0}%)</span>
                        </div>
                     </motion.div>
                     <motion.div 
                       whileHover={{ scale: 1.03, y: -2 }}
                       onMouseEnter={playScrollSound}
                       className="flex-1 bg-gradient-to-br from-pink-50 to-rose-50/60 p-3 rounded-xl border border-pink-100 flex flex-col items-center justify-center transition-all hover:shadow-sm cursor-pointer"
                     >
                        <span className="text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-wider">Perempuan</span>
                        <div className="flex items-baseline gap-1">
                           <span className="text-xl font-black text-pink-700 leading-none">{pr}</span>
                           <span className="text-[10px] font-bold text-slate-400">({totalSiswa ? ((pr/totalSiswa)*100).toFixed(0) : 0}%)</span>
                        </div>
                     </motion.div>
                  </div>

                  <motion.div 
                    whileHover={{ scale: 1.02, y: -2 }}
                    onMouseEnter={playScrollSound}
                    className="mt-3 p-3 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50/40 to-white border border-emerald-200/80 shadow-xs flex flex-col justify-between items-start gap-1 cursor-pointer transition-all group hover:shadow-md hover:border-emerald-300"
                  >
                     <div className="flex w-full items-center justify-between">
                         <span className="text-[10px] font-black text-emerald-800 uppercase flex items-center gap-1.5 tracking-wide">
                            <motion.div animate={{ rotate: [0, 360] }} transition={{ repeat: Infinity, duration: 8, ease: "linear" }}>
                              <Target size={14} className="text-emerald-600" />
                            </motion.div>
                            Rasio Rata-Rata / Rombel
                         </span>
                         <span className="text-[9px] font-bold text-emerald-600/80 uppercase">({rombels.length} Rombel)</span>
                     </div>
                     <div className="flex w-full items-end justify-between mt-1">
                        <span className="text-[9px] font-semibold text-emerald-700/80 bg-emerald-100/60 px-2 py-0.5 rounded-md border border-emerald-200/60">
                           Standar Ideal: 32 Siswa
                        </span>
                        <div className="text-right">
                           <span className="text-sm font-black text-emerald-700 block leading-none">{avgPerRombel} Siswa / Rombel</span>
                           <span className="text-[9px] font-bold text-emerald-600">{statusKapasitas}</span>
                        </div>
                     </div>
                  </motion.div>
              </motion.div>

              {/* CARD ZONA KRITIS */}
              <motion.div variants={cardVariants} whileHover={{ y: -2 }} className="bg-white/80 backdrop-blur-2xl rounded-[24px] p-4 shadow-sm border border-white flex flex-col justify-between shrink-0 transition-all hover:bg-white/95 hover:shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.15, 1] }}
                      transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                      className="p-1.5 rounded-xl bg-amber-500/15 text-amber-600"
                    >
                      <AlertTriangle size={15} />
                    </motion.div>
                    <h3 className="text-xs font-black text-slate-800">Zona Kritis (KKM {kkmValue})</h3>
                  </div>
                  <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    Rerata VIII: {avgRerata}
                  </span>
                </div>
                <div className="flex justify-between items-end mb-2">
                     <div className="flex flex-col">
                        <span className="text-xl font-black text-emerald-500 leading-none">{tuntasPersen}%</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase mt-1">Tuntas ({siswaTuntas.length})</span>
                     </div>
                     <div className="flex flex-col items-end">
                        <span className="text-xl font-black text-rose-500 leading-none">{remidiPersen}%</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase mt-1">Remidi ({siswaRemidi.length})</span>
                     </div>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full flex overflow-hidden shadow-inner p-[1.5px] gap-0.5 relative">
                   <motion.div 
                     initial={{ width: 0 }} 
                     animate={{ width: `${tuntasPersen}%` }} 
                     transition={{ duration: 1.2, ease: "easeOut" }} 
                     className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full relative overflow-hidden"
                   >
                     <motion.div 
                       animate={{ x: ['-100%', '200%'] }} 
                       transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }} 
                       className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent" 
                     />
                   </motion.div>
                   <motion.div 
                     initial={{ width: 0 }} 
                     animate={{ width: `${remidiPersen}%` }} 
                     transition={{ duration: 1.2, delay: 0.15, ease: "easeOut" }} 
                     className="h-full bg-gradient-to-r from-orange-400 to-rose-500 rounded-full relative overflow-hidden"
                   >
                     <motion.div 
                       animate={{ x: ['-100%', '200%'] }} 
                       transition={{ repeat: Infinity, duration: 2.2, ease: "linear", delay: 0.5 }} 
                       className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/35 to-transparent" 
                     />
                   </motion.div>
                </div>
              </motion.div>

              {/* CARD ANALISIS MAPEL DENGAN EFEK 3D POP-UP & SMOOTH GAME SCROLL */}
              <motion.div variants={cardVariants} className="bg-white/80 backdrop-blur-2xl rounded-[24px] p-4 shadow-sm border border-white flex flex-col flex-1 min-h-0 overflow-hidden group hover:bg-white/95 transition-all">
                <div className="flex items-center justify-between mb-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <motion.div 
                      animate={{ scale: [1, 1.15, 1], rotate: [0, 6, -6, 0] }}
                      transition={{ repeat: Infinity, duration: 2.8 }}
                      className="p-1.5 rounded-xl bg-rose-500/15 text-rose-600 shadow-2xs group-hover:bg-rose-500 group-hover:text-white transition-colors"
                    >
                      <AlertTriangle size={15} />
                    </motion.div>
                    <h3 className="text-xs font-black text-slate-800">Analisis Mapel (Remedial & Di Atas KKM)</h3>
                  </div>
                  <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                    {remedialSubjects.length} Mapel
                  </span>
                </div>

                <div 
                  onScroll={playScrollSound}
                  style={{ perspective: 1000 }}
                  className="flex-1 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] px-0.5 flex flex-col gap-2 min-h-0 scroll-smooth py-1"
                >
                    {remedialSubjects.map((mItem, mIdx) => (
                      <motion.div 
                        key={mIdx} 
                        onMouseEnter={playScrollSound}
                        whileHover={{ 
                          scale: 1.03, 
                          z: 20, 
                          rotateX: 2, 
                          rotateY: -2, 
                          backgroundColor: "rgba(255, 255, 255, 0.98)",
                          boxShadow: "0 10px 25px -5px rgba(244, 63, 94, 0.2), 0 8px 10px -6px rgba(244, 63, 94, 0.1)"
                        }}
                        whileTap={{ scale: 0.97 }}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        className="flex justify-between items-center text-[10px] bg-gradient-to-r from-rose-50/70 via-white to-emerald-50/40 p-2.5 rounded-xl border border-slate-100/90 cursor-pointer transition-colors shrink-0 origin-center"
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                           <motion.span 
                             animate={{ scale: [1, 1.4, 1] }} 
                             transition={{ repeat: Infinity, duration: 1.8, delay: mIdx * 0.08 }}
                             className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 shadow-xs" 
                           />
                           <span className="font-bold text-slate-800 truncate tracking-wide">{mItem.name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                           <span className="font-mono font-bold text-emerald-600 bg-emerald-50/80 px-2 py-0.5 rounded-md border border-emerald-200 shadow-2xs" title="Siswa di atas KKM">
                              {mItem.tuntas} Tuntas
                           </span>
                           <span className="font-mono font-black text-rose-600 bg-rose-100/70 px-2 py-0.5 rounded-md border border-rose-200 shadow-2xs" title="Siswa di bawah KKM">
                              {mItem.count} Remidi
                           </span>
                        </div>
                      </motion.div>
                    ))}
                    {remedialSubjects.length === 0 && (
                        <span className="text-[9px] text-slate-400 text-center py-4 italic">Belum ada data mata pelajaran</span>
                    )}
                </div>
              </motion.div>

            </div>

            {/* KOLOM 2 (TENGAH) - 10 JUARA UMUM KELAS 8 & GRAFIK MAPEL */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-3 min-h-0">
              
              {/* CARD 10 JUARA UMUM TERBAIK KELAS 8 */}
              <motion.div variants={cardVariants} className="bg-white/85 backdrop-blur-3xl rounded-[24px] p-3.5 shadow-sm border border-white flex flex-col shrink-0 overflow-hidden hover:bg-white/95 transition-all">
                <div className="flex items-center justify-between mb-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <motion.div 
                      animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.15, 1] }} 
                      transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                      className="p-1.5 rounded-xl bg-amber-500/15 text-amber-600 shadow-xs"
                    >
                      <Trophy size={16} />
                    </motion.div>
                    <h3 className="text-xs font-black text-slate-900">10 Juara Umum Terbaik Kelas 8</h3>
                  </div>
                  <motion.span 
                    animate={{ scale: [1, 1.06, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="text-[9px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1 shadow-2xs"
                  >
                    <Sparkles size={10} className="text-amber-500 animate-pulse" /> Top 10 Siswa
                  </motion.span>
                </div>

                <div className="flex flex-1 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] px-0.5 flex-col justify-between gap-1">
                    {top10Students.map((stu, sIdx) => {
                      const isTop3 = sIdx < 3;
                      const rankColors = sIdx === 0 
                        ? "bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-white border-amber-300 shadow-sm" 
                        : sIdx === 1 
                        ? "bg-gradient-to-r from-slate-300 via-slate-200 to-slate-300 text-slate-800 border-slate-300 shadow-xs" 
                        : sIdx === 2 
                        ? "bg-gradient-to-r from-orange-400 via-amber-500/80 to-orange-400 text-white border-orange-300 shadow-xs" 
                        : "bg-white/90 text-slate-700 border-slate-100/80 hover:bg-sky-50/60 hover:border-sky-200";

                      return (
                        <motion.div 
                          key={sIdx}
                          onMouseEnter={playScrollSound}
                          whileHover={{ scale: 1.01, x: 3 }}
                          transition={{ type: "spring", stiffness: 400, damping: 22 }}
                          className={`grid grid-cols-[1fr_auto] items-center px-2.5 py-1 rounded-xl border backdrop-blur-md transition-all cursor-pointer ${rankColors}`}
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-3">
                             <motion.div 
                                animate={sIdx < 3 ? { rotate: [0, 12, -12, 0], scale: [1, 1.12, 1] } : {}}
                                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut", delay: sIdx * 0.2 }}
                                className={`w-4 h-4 rounded-full flex items-center justify-center font-black text-[8px] shrink-0 ${
                                  sIdx === 0 ? 'bg-white text-amber-600 shadow-xs' : 
                                  sIdx === 1 ? 'bg-white text-slate-700 shadow-xs' : 
                                  sIdx === 2 ? 'bg-white text-orange-600 shadow-xs' : 
                                  'bg-slate-100 text-slate-500'
                                }`}
                             >
                                {sIdx === 0 ? <Crown size={9} className="fill-amber-500" /> : (sIdx + 1)}
                             </motion.div>
                             <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-black truncate tracking-wide leading-tight">{stu.nama}</p>
                                <p className={`text-[8px] font-semibold opacity-85 leading-none mt-0.5 ${isTop3 && sIdx !== 1 ? 'text-white/90' : 'text-slate-500'}`}>Kelas {stu.kelas}</p>
                             </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 text-right justify-self-end">
                             <div>
                                <span className="text-[6px] font-bold uppercase block opacity-70 leading-none">Total</span>
                                <span className={`text-[9px] font-mono font-bold leading-tight ${isTop3 && sIdx !== 1 ? 'text-white' : 'text-slate-800'}`}>{stu.jumlahNilai}</span>
                             </div>
                             <div className={`pl-2 border-l ${isTop3 && sIdx !== 1 ? 'border-white/30' : 'border-slate-200'}`}>
                                <span className="text-[6px] font-bold uppercase block opacity-70 leading-none">Rerata</span>
                                <span className={`text-[10px] font-mono font-black leading-tight ${isTop3 && sIdx !== 1 ? 'text-white' : 'text-cyan-600'}`}>{stu.rata}</span>
                             </div>
                          </div>
                        </motion.div>
                      );
                    })}

                    {top10Students.length === 0 && (
                       <span className="text-[9px] text-slate-400 text-center py-4 italic">Belum ada data peringkat siswa</span>
                    )}
                </div>
              </motion.div>

              {/* GRAFIK RERATA NILAI TIAP MAPEL KELAS 8 */}
              <motion.div variants={cardVariants} className="bg-white/85 backdrop-blur-3xl rounded-[24px] p-4 shadow-sm border border-white flex flex-col flex-1 min-h-0 hover:bg-white/95 transition-all">
                <div className="flex items-center justify-between mb-1 shrink-0">
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ y: [0, -2, 0], rotate: [0, -6, 6, 0] }}
                      transition={{ repeat: Infinity, duration: 3.2, ease: "easeInOut" }}
                      className="p-1.5 rounded-xl bg-cyan-500/15 text-cyan-600"
                    >
                      <BookOpen size={15} />
                    </motion.div>
                    <h3 className="text-xs font-black text-slate-900">Ketuntasan & Rerata Mapel Kelas 8</h3>
                  </div>
                </div>

                <div className="flex flex-col flex-1 min-h-0 mt-2 gap-3">
                  <div className="rounded-xl bg-gradient-to-br from-sky-50/90 via-white to-cyan-50/50 border border-sky-200 shadow-xs flex flex-col relative overflow-hidden flex-1 min-h-0 pt-2">
                    <div className="px-3 flex items-center gap-1.5 text-[9px] font-black uppercase text-sky-900 z-10">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping" />
                      Grafik Kinerja Mapel
                    </div>
                    {renderInteractiveMapelChart(mapelAverages)}
                  </div>
                </div>
              </motion.div>

            </div>

            {/* KOLOM 3 (KANAN) - GRAFIK RERATA NILAI STS PER KELAS (ROMBEL) KELAS 8 */}
            <div className="col-span-12 lg:col-span-5 flex flex-col gap-3 min-h-0">
              
              <motion.div variants={cardVariants} className="bg-white/85 backdrop-blur-3xl rounded-[24px] p-4 shadow-sm border border-white flex flex-col flex-1 min-h-0 overflow-hidden hover:bg-white/95 transition-all">
                
                {/* HEADER CARD & TOMBOL FILTER URUTAN */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <motion.div 
                      animate={{ scale: [1, 1.12, 1], rotate: [0, 6, -6, 0] }}
                      transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                      className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-sm"
                    >
                      <BarChart2 size={16} />
                    </motion.div>
                    <div>
                      <h3 className="text-xs font-black text-slate-900 leading-tight">Rerata Nilai STS per Kelas</h3>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Perbandingan Antar Rombel Kelas VIII</p>
                    </div>
                  </div>

                  {/* Toggle Filter Urut Kelas vs Peringkat */}
                  <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/70">
                    <button
                      onClick={() => { playScrollSound(); setRombelSort('urut'); }}
                      className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        rombelSort === 'urut' 
                          ? 'bg-white text-cyan-600 shadow-xs' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Urut Kelas
                    </button>
                    <button
                      onClick={() => { playScrollSound(); setRombelSort('peringkat'); }}
                      className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                        rombelSort === 'peringkat' 
                          ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-xs' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Trophy size={10} /> Ranking
                    </button>
                  </div>
                </div>

                {/* LIVE SPOTLIGHT BANNER (DETAIL KELAS SAAT HOVER) */}
                <AnimatePresence mode="wait">
                  {activeSpotlightRombel && (
                    <motion.div
                      key={activeSpotlightRombel.kelas}
                      initial={{ opacity: 0, y: -6, scale: 0.99 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.99 }}
                      transition={{ duration: 0.2 }}
                      className="mb-3 p-3 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950 text-white shadow-md border border-slate-700/80 flex items-center justify-between shrink-0 relative overflow-hidden"
                    >
                      <motion.div 
                        animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.25, 0.1] }}
                        transition={{ repeat: Infinity, duration: 4 }}
                        className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-cyan-400 blur-xl pointer-events-none" 
                      />
                      
                      <div className="flex items-center gap-3 z-10">
                        <motion.div 
                          animate={{ y: [0, -2, 0] }}
                          transition={{ repeat: Infinity, duration: 2.5 }}
                          className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center font-black shrink-0 border ${
                            activeSpotlightRombel.rank === 1 
                              ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 border-yellow-200 shadow-lg shadow-amber-500/20' 
                              : activeSpotlightRombel.rank === 2 
                              ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900 border-white' 
                              : activeSpotlightRombel.rank === 3 
                              ? 'bg-gradient-to-br from-orange-400 to-amber-600 text-white border-orange-200' 
                              : 'bg-white/10 text-cyan-300 border-white/15'
                          }`}
                        >
                          <span className="text-[7px] uppercase tracking-tighter opacity-80 leading-none">Rank</span>
                          <span className="text-sm leading-none mt-0.5">#{activeSpotlightRombel.rank}</span>
                        </motion.div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-black tracking-tight">Kelas {activeSpotlightRombel.kelas}</span>
                            {activeSpotlightRombel.rank === 1 && (
                              <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-0.5">
                                <Crown size={9} className="fill-amber-300" /> Terbaik
                              </span>
                            )}
                          </div>
                          <p className="text-[9px] text-slate-300 font-medium mt-0.5">
                            {activeSpotlightRombel.totalSiswa} Siswa • Tertinggi: <strong className="text-emerald-300">{activeSpotlightRombel.maxScore}</strong> • Terendah: <strong className="text-rose-300">{activeSpotlightRombel.minScore}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 z-10 text-right">
                        <div className="hidden sm:block pr-3 border-r border-white/15">
                          <span className="text-[8px] font-bold uppercase text-slate-400 block">Tuntas KKM</span>
                          <span className="text-xs font-black text-emerald-400">{activeSpotlightRombel.persenTuntas}%</span>
                          <span className="text-[8px] text-slate-400 block">({activeSpotlightRombel.tuntas}/{activeSpotlightRombel.totalSiswa})</span>
                        </div>
                        <div>
                          <span className="text-[8px] font-bold uppercase text-cyan-300 block">Rerata STS</span>
                          <span className="text-2xl font-black text-white leading-none">{activeSpotlightRombel.avg}</span>
                          <span className={`text-[8px] font-bold block mt-0.5 ${
                            activeSpotlightRombel.avg >= parseFloat(avgRerata) ? 'text-emerald-400' : 'text-amber-300'
                          }`}>
                            {activeSpotlightRombel.avg >= parseFloat(avgRerata) 
                              ? `+${(activeSpotlightRombel.avg - parseFloat(avgRerata)).toFixed(1)} vs Angkatan` 
                              : `${(activeSpotlightRombel.avg - parseFloat(avgRerata)).toFixed(1)} vs Angkatan`}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* VISUAL VERTICAL BAR CHART ANTAR KELAS (DENGAN HEADER RERATA VIII BEBAS TUMPUK) */}
                <div className="relative rounded-2xl bg-gradient-to-b from-sky-50/70 via-white to-slate-50/80 border border-sky-100 p-3 pt-9 flex flex-col justify-end h-[215px] shrink-0 overflow-hidden shadow-inner">
                  
                  {/* TOP BAR: LENCANA RERATA ANGKATAN VIII AGAR TIDAK PERNAH TERTUTUP BATANG KELAS */}
                  <div className="absolute top-2 left-3 right-3 flex items-center justify-between z-30 pointer-events-none">
                    <div className="flex items-center gap-2 text-[8px] font-bold text-slate-500">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-xs bg-gradient-to-r from-cyan-400 to-blue-500 inline-block" /> Di Atas Rerata
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-xs bg-slate-300 inline-block" /> Di Bawah Rerata
                      </span>
                    </div>

                    <motion.div 
                      animate={{ scale: [1, 1.04, 1] }}
                      transition={{ repeat: Infinity, duration: 2.5 }}
                      className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full shadow-sm border border-cyan-300/60 flex items-center gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-ping" />
                      <span>Rerata VIII: {avgRerata}</span>
                    </motion.div>
                  </div>

                  {/* Indikator Garis Rata-Rata Angkatan & Batang Kelas */}
                  {rombelStats.length > 0 && (() => {
                    const allAvgs = rombelStats.map(r => r.avg);
                    const minBar = Math.max(0, Math.min(...allAvgs, parseFloat(avgRerata)) - 8);
                    const maxBar = Math.min(100, Math.max(...allAvgs, parseFloat(avgRerata)) + 5);
                    const avgRatio = ((parseFloat(avgRerata) - minBar) / (maxBar - minBar || 1)) * 100;
                    const clampedAvgBottom = Math.max(18, Math.min(76, avgRatio));

                    return (
                      <>
                        {/* Garis Referensi Rata-rata Angkatan di Lapisan Z-30 (Di Atas Bar Z-20) */}
                        <div 
                          style={{ bottom: `${clampedAvgBottom}%` }} 
                          className="absolute left-2 right-2 border-t-[1.5px] border-dashed border-cyan-600/70 z-30 pointer-events-none flex items-center justify-between"
                        >
                          <span className="bg-cyan-700/90 backdrop-blur-xs text-white text-[7px] font-black px-1.5 py-0.2 rounded -mt-3.5 shadow-2xs border border-cyan-300/40">
                            AVG {avgRerata}
                          </span>
                        </div>

                        {/* Bar Container */}
                        <div className="flex items-end justify-between gap-1.5 w-full h-full z-20 pt-2">
                          {rombelStats.map((item) => {
                            const heightPct = Math.max(15, Math.min(92, ((item.avg - minBar) / (maxBar - minBar || 1)) * 100));
                            const isSelected = activeSpotlightRombel?.kelas === item.kelas;
                            const isAboveAvg = item.avg >= parseFloat(avgRerata);

                            const barGradient = item.rank === 1
                              ? "from-amber-400 via-yellow-400 to-orange-500 shadow-amber-400/30"
                              : item.rank === 2
                              ? "from-teal-400 via-emerald-400 to-teal-600 shadow-emerald-400/25"
                              : item.rank === 3
                              ? "from-sky-400 via-cyan-500 to-blue-600 shadow-cyan-400/25"
                              : isAboveAvg
                              ? "from-cyan-400 to-blue-500"
                              : "from-slate-300 to-slate-400";

                            return (
                              <motion.div
                                layout
                                key={item.kelas}
                                onMouseEnter={() => { playScrollSound(); setHoveredRombel(item); }}
                                className="flex-1 h-full flex flex-col items-center justify-end group cursor-pointer relative"
                              >
                                {/* Angka Nilai di Atas Bar */}
                                <motion.span 
                                  animate={{ 
                                    y: isSelected ? -3 : 0, 
                                    scale: isSelected ? 1.15 : 1 
                                  }}
                                  className={`text-[9px] font-mono font-black mb-1 z-30 transition-colors ${
                                    isSelected ? 'text-slate-950 bg-amber-300 px-1.5 py-0.2 rounded-md shadow-xs ring-1 ring-amber-400' : 'text-slate-600'
                                  }`}
                                >
                                  {item.avg}
                                </motion.span>

                                {/* Mahkota untuk Juara 1 Rombel */}
                                {item.rank === 1 && (
                                  <motion.div
                                    animate={{ y: [0, -3, 0], rotate: [0, 8, -8, 0] }}
                                    transition={{ repeat: Infinity, duration: 1.8 }}
                                    className="mb-0.5 text-amber-500 z-30"
                                  >
                                    <Crown size={11} className="fill-amber-400" />
                                  </motion.div>
                                )}

                                {/* Batang Grafik (Bar) */}
                                <div className="w-full max-w-[34px] h-full flex items-end justify-center bg-slate-100/80 rounded-t-xl p-0.5 overflow-hidden border border-slate-200/50">
                                  <motion.div
                                    layout
                                    initial={{ height: 0 }}
                                    animate={{ 
                                      height: `${heightPct}%`,
                                      scaleX: isSelected ? 1.06 : 1
                                    }}
                                    transition={{ type: "spring", stiffness: 260, damping: 22 }}
                                    className={`w-full rounded-t-lg bg-gradient-to-t ${barGradient} shadow-md transition-all relative overflow-hidden ${
                                      isSelected ? 'ring-2 ring-slate-900/20 brightness-110' : 'opacity-90 hover:opacity-100'
                                    }`}
                                  >
                                    <motion.div 
                                      animate={{ y: ['100%', '-100%'] }}
                                      transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                                      className="w-full h-1/2 bg-gradient-to-t from-transparent via-white/35 to-transparent"
                                    />
                                  </motion.div>
                                </div>

                                {/* Label Nama Kelas di Bawah Bar */}
                                <span className={`text-[8px] font-black mt-1.5 truncate max-w-full tracking-tighter transition-colors ${
                                  isSelected ? 'text-cyan-700 underline decoration-2' : 'text-slate-500'
                                }`}>
                                  {item.kelas.replace(/^kelas\s*/i, '')}
                                </span>
                              </motion.div>
                            );
                          })}
                        </div>
                      </>
                    );
                  })()}

                  {rombelStats.length === 0 && (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                      Memuat grafik rerata kelas...
                    </div>
                  )}
                </div>

                {/* DAFTAR KARTU DETAIL ROMBEL (2 KOLOM SCROLLABLE & SINKRON DENGAN GRAFIK) */}
                <div className="mt-3 flex items-center justify-between shrink-0">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                    <Sparkles size={10} className="text-cyan-500 animate-pulse" /> Detail Ketuntasan per Kelas (Sentuh untuk Sorot)
                  </span>
                  <span className="text-[9px] font-bold text-cyan-600">{rombelStats.length} Rombel</span>
                </div>

                <div 
                  onScroll={playScrollSound}
                  className="mt-1.5 flex-1 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] grid grid-cols-2 gap-2 px-0.5 py-0.5 min-h-0 content-start"
                >
                  {rombelStats.map((rItem) => {
                    const isSelected = activeSpotlightRombel?.kelas === rItem.kelas;
                    return (
                      <motion.div
                        layout
                        key={rItem.kelas}
                        onMouseEnter={() => { playScrollSound(); setHoveredRombel(rItem); }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected 
                            ? 'bg-gradient-to-br from-cyan-50 via-white to-sky-50 border-cyan-400 shadow-sm ring-1 ring-cyan-300/50' 
                            : 'bg-white/80 border-slate-100 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className={`w-4 h-4 rounded-md text-[8px] font-black flex items-center justify-center shrink-0 ${
                              rItem.rank === 1 
                                ? 'bg-amber-400 text-white shadow-2xs' 
                                : rItem.rank === 2 
                                ? 'bg-slate-300 text-slate-800' 
                                : rItem.rank === 3 
                                ? 'bg-orange-400 text-white' 
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {rItem.rank}
                            </span>
                            <span className="text-[10px] font-black text-slate-800 truncate">
                              Kelas {rItem.kelas}
                            </span>
                          </div>
                          <span className="text-xs font-mono font-black text-cyan-600 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-100">
                            {rItem.avg}
                          </span>
                        </div>

                        {/* Mini Progress Bar Ketuntasan Kelas */}
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex mb-1">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${rItem.persenTuntas}%` }}
                            transition={{ duration: 1 }}
                            className="h-full bg-gradient-to-r from-emerald-400 to-teal-500"
                          />
                          <div className="flex-1 h-full bg-rose-300/60" />
                        </div>

                        <div className="flex items-center justify-between text-[8px] font-bold">
                          <span className="text-emerald-600">{rItem.tuntas} Tuntas ({rItem.persenTuntas}%)</span>
                          <span className="text-rose-500">{rItem.remidi} Remidi</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

              </motion.div>

            </div>
        </div>
      </main>

    </motion.div>
  );
}
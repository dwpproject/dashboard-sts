"use client";

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, User, CheckCircle2, 
  MessageSquare, ThumbsUp, AlertOctagon, Activity, 
  Target, Sparkles, Crown, ShieldAlert, Trophy, AlertTriangle
} from 'lucide-react';

interface DashboardStatisticsProps {
  dashboardData: {
    '7'?: any[];
    '8'?: any[];
    '9'?: any[];
    umpan_balik?: any[];
  };
  displaySettings: {
    showDemografi?: boolean;
    showZonaPerhatian?: boolean;
    showCapaian?: boolean;
    showPodium?: boolean;
    showSebaran?: boolean;
  };
}

const STANDAR_KKM = 75;

// Pemetaan kunci untuk mendukung format Excel maupun database MySQL (snake_case)
const MAPEL_KEYS = [
  { excel: 'Agm', mysql: 'agm', nama: 'Agama' },
  { excel: 'PP', mysql: 'pp', nama: 'Pend. Pancasila' },
  { excel: 'B.Ind', mysql: 'b_ind', nama: 'B. Indonesia' },
  { excel: 'Mtk', mysql: 'mtk', nama: 'Matematika' },
  { excel: 'IPA', mysql: 'ipa', nama: 'IPA' },
  { excel: 'IPS', mysql: 'ips', nama: 'IPS' },
  { excel: 'B.ING', mysql: 'b_ing', nama: 'B. Inggris' },
  { excel: 'SBP', mysql: 'sbp', nama: 'Seni Budaya' },
  { excel: 'PJOK', mysql: 'pjok', nama: 'PJOK' },
  { excel: 'Mulok', mysql: 'mulok', nama: 'Muatan Lokal' },
  { excel: 'Tik', mysql: 'tik', nama: 'Informatika/TIK' },
  { excel: 'BK', mysql: 'bk', nama: 'Bimbingan Konseling' },
  { excel: 'KODING', mysql: 'koding', nama: 'Koding' }
];

export default function DashboardStatistics({ dashboardData, displaySettings }: DashboardStatisticsProps) {
  
  const [activeFeedbackTab, setActiveFeedbackTab] = useState<'ringkasan' | 'grafik' | 'kendala'>('ringkasan');

  // Proses Data Sentral
  const stats = useMemo(() => {
    const data7 = dashboardData?.['7'] || [];
    const data8 = dashboardData?.['8'] || [];
    const data9 = dashboardData?.['9'] || [];
    const ub = dashboardData?.umpan_balik || [];
    
    const allStudents = [...data7, ...data8, ...data9];
    const total = allStudents.length;

    // 1. Demografi L/P (Dukung 'JK' atau 'jk')
    const totalLaki = allStudents.filter(s => (s.JK || s.jk)?.toUpperCase() === 'L').length;
    const totalPerempuan = allStudents.filter(s => (s.JK || s.jk)?.toUpperCase() === 'P').length;

    // 2. Kalkulasi Rata-rata & KKM Keseluruhan & Podium
    let totalRataRataSum = 0, tuntasKKM = 0, dibawahKKM = 0;
    const rombelScores: Record<string, { totalScore: number, count: number }> = {};

    allStudents.forEach(s => {
      // Mendukung kunci 'RATA-RATA', 'RATA2', atau 'rata_rata' dari MySQL
      const rata2 = Number(s["RATA-RATA"] || s.RATA2 || s.rata_rata || 0);
      // Mendukung kunci 'Kelas' atau 'kelas'
      const kelas = String(s.Kelas || s.kelas || '').trim();
      
      if (rata2 > 0) {
        totalRataRataSum += rata2;
        if (rata2 >= STANDAR_KKM) tuntasKKM++;
        else dibawahKKM++; 

        if (kelas) {
          if (!rombelScores[kelas]) rombelScores[kelas] = { totalScore: 0, count: 0 };
          rombelScores[kelas].totalScore += rata2;
          rombelScores[kelas].count++;
        }
      }
    });

    const topRombelOverall = Object.entries(rombelScores)
      .map(([nama, val]) => ({ nama, avg: val.totalScore / val.count }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 3); // Top 3 Keseluruhan Angkatan

    // Helper: Kalkulasi Tingkat Avg
    const getTingkatAvg = (data: any[]) => {
      let sum = 0, count = 0;
      data.forEach(s => { 
        const r = Number(s["RATA-RATA"] || s.RATA2 || s.rata_rata || 0); 
        if (r > 0) { sum += r; count++; } 
      });
      return count > 0 ? (sum / count).toFixed(2) : '0.00';
    };

    // Helper: Top Remedial Mapel per Tingkat
    const getTopRemedial = (data: any[]) => {
      const mapelCounts: { [key: string]: number } = {};
      MAPEL_KEYS.forEach(m => mapelCounts[m.nama] = 0);

      data.forEach(s => {
        MAPEL_KEYS.forEach(mapel => {
          // Cari nilai berdasarkan format excel ATAU format mysql ATAU huruf kecil/besar
          let val = s[mapel.excel] ?? s[mapel.mysql] ?? s[mapel.excel.toLowerCase()] ?? s[mapel.excel.toUpperCase()] ?? null;
          
          const num = parseFloat(val);
          // Jika nilai terdeteksi berupa angka, > 0 (bukan kosong), dan < KKM
          if (!isNaN(num) && num > 0 && num < STANDAR_KKM) {
             mapelCounts[mapel.nama]++;
          }
        });
      });
      
      return Object.entries(mapelCounts)
         .map(([nama, count]) => ({ nama, count }))
         .sort((a, b) => b.count - a.count)
         .slice(0, 3);
    };

    // 3. Analisis Umpan Balik Exambro
    let kelancaranScores = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    let kemudahanScores = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    let lanjutExambroCount = 0, tidakLanjutExambroCount = 0;
    const kendalaList: {nama: string, kelas: string, keluhan: string}[] = [];

    ub.forEach(row => {
      // Kelancaran
      const kelancaran = String(row.kelancaran || row["Apakah aplikasi berjalan lancar selama ujian berlangsung?"] || '').trim();
      if (['1','2','3','4','5'].includes(kelancaran)) {
        kelancaranScores[kelancaran as keyof typeof kelancaranScores]++;
      } else if (kelancaran.toLowerCase().includes('lancar') || kelancaran.toLowerCase().includes('ya')) {
        kelancaranScores['5']++;
      }

      // Kemudahan
      const kemudahan = String(row.kemudahan || row["Seberapa mudah penggunaan aplikasi Exambro saat ujian?"] || '').trim();
      if (['1','2','3','4','5'].includes(kemudahan)) {
        kemudahanScores[kemudahan as keyof typeof kemudahanScores]++;
      }

      // Setuju Lanjut
      const lanjut = String(row.lanjut_exambro || row["Untuk kedepannya, apakah pelaksanaan STS sebaiknya tetap menggunakan aplikasi Exambro? "] || row["Untuk kedepannya, apakah pelaksanaan STS sebaiknya tetap menggunakan aplikasi Exambro?"] || '').toLowerCase();
      if (lanjut && lanjut !== '-' && lanjut !== 'null') {
        if (lanjut.includes('ya') || lanjut.includes('tetap') || lanjut.includes('setuju')) {
          lanjutExambroCount++;
        } else if (lanjut.includes('tidak')) {
          tidakLanjutExambroCount++;
        }
      }

      // Kendala
      const kendala = String(row.deskripsi_kendala || row["Jika mengalami kendala, jelaskan kendala yang Anda alami!"] || '').trim();
      if (kendala && kendala !== '-' && !kendala.toLowerCase().includes('tidak ada') && !kendala.toLowerCase().includes('tidak') && !kendala.toLowerCase().includes('aman') && kendala.length > 5) {
        kendalaList.push({ 
          nama: row.nama_siswa || row["NAMA SISWA"] || 'Anonim', 
          kelas: row.kelas || row["KELAS"] || '-', 
          keluhan: kendala 
        });
      }
    });

    const validUBCount = tuntasKKM + dibawahKKM;

    return {
      total,
      laki: totalLaki, persenLaki: total > 0 ? ((totalLaki / total) * 100).toFixed(1) : '0',
      perempuan: totalPerempuan, persenPerempuan: total > 0 ? ((totalPerempuan / total) * 100).toFixed(1) : '0',
      k7: { avg: getTingkatAvg(data7), remedial: getTopRemedial(data7) },
      k8: { avg: getTingkatAvg(data8), remedial: getTopRemedial(data8) },
      k9: { avg: getTingkatAvg(data9), remedial: getTopRemedial(data9) },
      avgKeseluruhan: validUBCount > 0 ? (totalRataRataSum / validUBCount).toFixed(2) : '0.00',
      persenTuntas: validUBCount > 0 ? ((tuntasKKM / validUBCount) * 100).toFixed(1) : '0.0',
      tuntasKKM, dibawahKKM,
      persenDibawah: validUBCount > 0 ? ((dibawahKKM / validUBCount) * 100).toFixed(1) : '0.0',
      topRombelOverall,
      totalUB: ub.length,
      persenLancar: ub.length > 0 ? (((kelancaranScores['4'] + kelancaranScores['5']) / ub.length) * 100).toFixed(1) : '0',
      persenLanjut: (lanjutExambroCount + tidakLanjutExambroCount) > 0 ? ((lanjutExambroCount / (lanjutExambroCount + tidakLanjutExambroCount)) * 100).toFixed(1) : '0',
      kelancaranScores, kemudahanScores, topKendala: kendalaList.slice(0, 5)
    };
  }, [dashboardData]);

  // Ubah bagian ini di dalam DashboardStatistics.tsx
const containerVars = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } } as any;
const itemVars = { hidden: { opacity: 0, y: 30, scale: 0.95 }, show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 350, damping: 25 } } } as any;

const floatAnim = { y: [-5, 5, -5], transition: { repeat: Infinity, duration: 4, ease: "easeInOut" } } as any;
const pulseAnim = { scale: [1, 1.05, 1], transition: { repeat: Infinity, duration: 3, ease: "easeInOut" } } as any;
const rotateAnim = { rotate: [0, 360], transition: { repeat: Infinity, duration: 30, ease: "linear" } } as any;
const shimmerAnim = { x: ['-100%', '100%'], transition: { repeat: Infinity, duration: 2.5, ease: "linear" } } as any;

  const GlassCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <motion.div variants={itemVars} className={`relative overflow-hidden bg-white/40 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.06)] rounded-[2rem] p-5 lg:p-6 group ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-50 pointer-events-none rounded-[2rem]"></div>
      {children}
    </motion.div>
  );

  const AnimatedDonut = ({ percentage, color, icon: Icon }: { percentage: string, color: string, icon: any }) => (
    <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
      <svg viewBox="0 0 36 36" className="w-full h-full drop-shadow-md transform -rotate-90">
        <path className="text-white/40" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
        <motion.path initial={{ strokeDasharray: "0, 100" }} animate={{ strokeDasharray: `${percentage}, 100` }} transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }} className={color} strokeWidth="3.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Icon size={14} className={`mb-0.5 ${color}`} />
        <span className={`text-[10px] font-black ${color}`}>{percentage}%</span>
      </div>
    </div>
  );

  return (
    <motion.div variants={containerVars} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-12 auto-rows-auto gap-4 lg:gap-5 w-full h-full content-start text-slate-800">
      
      {/* 1. DEMOGRAFI & SISWA AKTIF (COL 1-4) */}
      {displaySettings.showDemografi !== false && (
        <GlassCard className="col-span-12 md:col-span-6 xl:col-span-4 bg-gradient-to-br from-indigo-50/50 to-cyan-50/50 flex flex-col justify-between">
          <motion.div animate={floatAnim} className="absolute -right-10 -top-10 text-indigo-400/10"><Users size={180} /></motion.div>
          
          <div>
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <motion.div animate={pulseAnim} className="p-3 bg-white/80 text-indigo-600 rounded-2xl shadow-sm border border-white"><Users size={22} /></motion.div>
              <div>
                <h3 className="font-extrabold text-sm tracking-tight">Demografi Siswa</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Total Keseluruhan</p>
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-6 relative z-10">
              <h1 className="text-6xl font-black text-indigo-950 tracking-tighter drop-shadow-sm">{stats.total}</h1>
              <span className="text-xs font-bold text-indigo-600/70 bg-indigo-100/50 px-2 py-1 rounded-lg">Siswa Aktif</span>
            </div>

            <div className="space-y-3 relative z-10">
              <div className="bg-white/60 backdrop-blur-md p-3 rounded-2xl border border-white flex items-center justify-between shadow-sm">
                 <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center"><User size={16}/></div> <span className="text-xs font-bold text-slate-700">Laki-Laki</span></div>
                 <div className="text-right"><p className="text-sm font-black text-slate-900">{stats.laki}</p><p className="text-[9px] font-bold text-slate-400">{stats.persenLaki}%</p></div>
              </div>
              <div className="bg-white/60 backdrop-blur-md p-3 rounded-2xl border border-white flex items-center justify-between shadow-sm">
                 <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center"><User size={16}/></div> <span className="text-xs font-bold text-slate-700">Perempuan</span></div>
                 <div className="text-right"><p className="text-sm font-black text-slate-900">{stats.perempuan}</p><p className="text-[9px] font-bold text-slate-400">{stats.persenPerempuan}%</p></div>
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* 2. CAPAIAN KESELURUHAN & TINGKAT (COL 5-8) */}
      {displaySettings.showCapaian !== false && (
        <GlassCard className="col-span-12 md:col-span-6 xl:col-span-4 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 flex flex-col justify-between">
           <motion.div animate={rotateAnim} className="absolute -left-16 -bottom-16 text-emerald-400/10"><Target size={200} /></motion.div>
           
           <div>
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                  <motion.div animate={pulseAnim} className="p-3 bg-white/80 text-emerald-600 rounded-2xl shadow-sm border border-white"><Target size={22} /></motion.div>
                  <div>
                    <h3 className="font-extrabold text-sm tracking-tight">Capaian Akademik</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Evaluasi KKM {STANDAR_KKM}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between bg-white/60 backdrop-blur-md p-4 rounded-[2rem] border border-white shadow-sm mb-5 relative z-10">
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Rata-Rata Umum</p>
                    <h2 className="text-4xl font-black text-emerald-950 tracking-tighter">{stats.avgKeseluruhan}</h2>
                 </div>
                 <AnimatedDonut percentage={stats.persenTuntas} color="text-emerald-500" icon={CheckCircle2} />
              </div>

              <div className="grid grid-cols-3 gap-2 relative z-10">
                {[ { t: 'Kelas 7', a: stats.k7.avg }, { t: 'Kelas 8', a: stats.k8.avg }, { t: 'Kelas 9', a: stats.k9.avg } ].map((k, i) => (
                   <div key={i} className="bg-white/50 backdrop-blur-sm border border-white/60 p-3 rounded-2xl text-center shadow-[0_2px_10px_rgba(0,0,0,0.02)] group hover:bg-white/80 transition-colors">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">{k.t}</p>
                      <p className="text-lg font-black text-slate-800">{k.a}</p>
                   </div>
                ))}
              </div>
           </div>
        </GlassCard>
      )}

      {/* 3. UMPAN BALIK EXAMBRO (COL 9-12) */}
      <GlassCard className="col-span-12 xl:col-span-4 bg-gradient-to-br from-violet-50/50 to-fuchsia-50/50 flex flex-col justify-between">
         <motion.div animate={floatAnim} className="absolute right-0 top-1/4 text-violet-400/10"><MessageSquare size={150} /></motion.div>
         
         <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <motion.div animate={pulseAnim} className="p-3 bg-white/80 text-violet-600 rounded-2xl shadow-sm border border-white"><Sparkles size={22} /></motion.div>
                <div>
                  <h3 className="font-extrabold text-sm tracking-tight">Umpan Balik STS</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{stats.totalUB} Responden</p>
                </div>
              </div>
            </div>

            <div className="flex bg-white/50 p-1 rounded-xl border border-white/60 shadow-sm mb-4">
              {[ { id: 'ringkasan', label: 'Overview' }, { id: 'grafik', label: 'Statistik' }, { id: 'kendala', label: 'Kendala' } ].map((tab) => (
                <button key={tab.id} onClick={() => setActiveFeedbackTab(tab.id as any)} className={`relative flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${activeFeedbackTab === tab.id ? 'text-violet-700' : 'text-slate-500 hover:text-slate-700'}`}>
                  {activeFeedbackTab === tab.id && <motion.div layoutId="fbGlassTab" className="absolute inset-0 bg-white rounded-lg shadow-sm border border-white" />}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="flex-1 relative min-h-[140px]">
               <AnimatePresence mode="wait">
                  {activeFeedbackTab === 'ringkasan' && (
                     <motion.div key="ringkasan" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex gap-3 h-full">
                        <div className="flex-1 bg-white/60 backdrop-blur-md rounded-2xl border border-white p-4 shadow-sm flex flex-col justify-center items-center text-center">
                           <Activity size={24} className="text-emerald-500 mb-2"/>
                           <h2 className="text-2xl font-black text-emerald-600 leading-none mb-1">{stats.persenLancar}%</h2>
                           <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Aplikasi Lancar</span>
                        </div>
                        <div className="flex-1 bg-white/60 backdrop-blur-md rounded-2xl border border-white p-4 shadow-sm flex flex-col justify-center items-center text-center">
                           <ThumbsUp size={24} className="text-blue-500 mb-2"/>
                           <h2 className="text-2xl font-black text-blue-600 leading-none mb-1">{stats.persenLanjut}%</h2>
                           <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Setuju Lanjut</span>
                        </div>
                     </motion.div>
                  )}
                  {activeFeedbackTab === 'grafik' && (
                     <motion.div key="grafik" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full bg-white/60 backdrop-blur-md rounded-2xl border border-white p-4 shadow-sm flex flex-col justify-center">
                        <div className="flex items-center justify-between mb-2">
                           <span className="text-[10px] font-bold text-slate-500">Kelancaran (1-5)</span>
                           <span className="text-[10px] font-black text-violet-600">{stats.persenLancar}% Positif</span>
                        </div>
                        <div className="flex items-end justify-between h-16 gap-1 border-b border-slate-200/50 pb-1">
                           {['1','2','3','4','5'].map(k => {
                              const val = stats.kelancaranScores[k as keyof typeof stats.kelancaranScores];
                              const max = Math.max(...Object.values(stats.kelancaranScores), 1);
                              return (
                                 <div key={k} className="flex-1 flex flex-col justify-end items-center h-full group relative">
                                    <div className="absolute -top-6 opacity-0 group-hover:opacity-100 bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded font-bold transition-opacity">{val}</div>
                                    <motion.div initial={{ height: 0 }} animate={{ height: `${(val/max)*100}%` }} className={`w-full max-w-[12px] rounded-t-sm ${['4','5'].includes(k) ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                                    <span className="text-[8px] font-bold text-slate-400 mt-1">{k}</span>
                                 </div>
                              )
                           })}
                        </div>
                     </motion.div>
                  )}
                  {activeFeedbackTab === 'kendala' && (
                     <motion.div key="kendala" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="h-full bg-white/60 backdrop-blur-md rounded-2xl border border-white p-3 shadow-sm overflow-y-auto no-scrollbar">
                        {stats.topKendala.length > 0 ? (
                           <ul className="space-y-2">
                              {stats.topKendala.slice(0,3).map((k, i) => (
                                 <li key={i} className="bg-white/80 p-2 rounded-xl border border-slate-100 border-l-2 border-l-amber-400 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                                    <div className="flex justify-between items-center mb-1"><span className="text-[9px] font-black text-slate-800 truncate pr-2">{k.nama}</span><span className="text-[8px] font-bold text-amber-600 bg-amber-50 px-1.5 rounded">{k.kelas}</span></div>
                                    <p className="text-[10px] text-slate-600 font-medium italic truncate">"{k.keluhan}"</p>
                                 </li>
                              ))}
                           </ul>
                        ) : (
                           <div className="flex flex-col items-center justify-center h-full opacity-50"><CheckCircle2 size={24} className="text-emerald-500 mb-1"/><p className="text-[10px] font-bold">Nihil Keluhan</p></div>
                        )}
                     </motion.div>
                  )}
               </AnimatePresence>
            </div>
         </div>
      </GlassCard>

      {/* 4. PODIUM ROMBEL TERBAIK KESELURUHAN (COL 1-7) */}
      {displaySettings.showPodium !== false && (
        <GlassCard className="col-span-12 lg:col-span-7 bg-gradient-to-br from-amber-50/80 to-orange-50/80 flex flex-col">
           <motion.div animate={floatAnim} className="absolute left-1/2 top-10 -translate-x-1/2 text-amber-400/10"><Crown size={200} /></motion.div>
           
           <div className="flex items-center gap-3 mb-6 relative z-10">
              <motion.div animate={pulseAnim} className="p-3 bg-white/80 text-amber-500 rounded-2xl shadow-sm border border-white"><Trophy size={22} /></motion.div>
              <div>
                 <h3 className="font-extrabold text-sm tracking-tight">Podium Rombel Terbaik</h3>
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Peringkat Rata-Rata Tertinggi Keseluruhan</p>
              </div>
           </div>

           <div className="flex-1 flex items-end justify-center gap-2 md:gap-4 relative z-10 min-h-[160px] pt-4">
              {/* Podium 2 */}
              {stats.topRombelOverall[1] && (
                 <motion.div initial={{ height: 0 }} animate={{ height: '65%' }} className="flex flex-col items-center w-1/3 max-w-[120px]">
                    <span className="text-[10px] font-black text-slate-600 mb-1">{stats.topRombelOverall[1].nama}</span>
                    <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white shadow-md flex items-center justify-center text-xs font-black text-slate-500 mb-2 z-10">2</div>
                    <div className="w-full bg-gradient-to-t from-slate-200/50 to-white/60 border border-white shadow-inner rounded-t-2xl flex-1 flex justify-center pt-3 relative overflow-hidden">
                       <div className="absolute inset-0 bg-white/20"></div>
                       <span className="text-sm font-black text-slate-700 relative z-10">{stats.topRombelOverall[1].avg.toFixed(1)}</span>
                    </div>
                 </motion.div>
              )}
              
              {/* Podium 1 */}
              {stats.topRombelOverall[0] && (
                 <motion.div initial={{ height: 0 }} animate={{ height: '100%' }} className="flex flex-col items-center w-1/3 max-w-[140px] z-20">
                    <span className="text-xs font-black text-amber-700 mb-1">{stats.topRombelOverall[0].nama}</span>
                    <motion.div animate={pulseAnim} className="w-10 h-10 rounded-full bg-amber-400 border-2 border-white shadow-lg flex items-center justify-center text-sm font-black text-amber-900 mb-2 z-10">
                       <Crown size={16} />
                    </motion.div>
                    <div className="w-full bg-gradient-to-t from-amber-200/50 to-amber-100/80 border border-white shadow-lg rounded-t-2xl flex-1 flex justify-center pt-4 relative overflow-hidden">
                       <motion.div animate={shimmerAnim} className="absolute inset-0 w-[200%] bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"></motion.div>
                       <span className="text-lg font-black text-amber-900 relative z-10">{stats.topRombelOverall[0].avg.toFixed(1)}</span>
                    </div>
                 </motion.div>
              )}

              {/* Podium 3 */}
              {stats.topRombelOverall[2] && (
                 <motion.div initial={{ height: 0 }} animate={{ height: '50%' }} className="flex flex-col items-center w-1/3 max-w-[120px]">
                    <span className="text-[10px] font-black text-slate-600 mb-1">{stats.topRombelOverall[2].nama}</span>
                    <div className="w-8 h-8 rounded-full bg-orange-200 border-2 border-white shadow-md flex items-center justify-center text-xs font-black text-orange-700 mb-2 z-10">3</div>
                    <div className="w-full bg-gradient-to-t from-orange-100/50 to-white/60 border border-white shadow-inner rounded-t-2xl flex-1 flex justify-center pt-3 relative overflow-hidden">
                       <div className="absolute inset-0 bg-white/20"></div>
                       <span className="text-sm font-black text-slate-700 relative z-10">{stats.topRombelOverall[2].avg.toFixed(1)}</span>
                    </div>
                 </motion.div>
              )}
              
              {stats.topRombelOverall.length === 0 && <div className="h-full flex items-center opacity-50"><p className="text-xs font-bold">Belum ada data nilai</p></div>}
           </div>
        </GlassCard>
      )}

      {/* 5. ZONA KRITIS & REMEDIAL (COL 8-12) */}
      {(displaySettings.showZonaPerhatian !== false || displaySettings.showSebaran !== false) && (
        <GlassCard className="col-span-12 lg:col-span-5 bg-gradient-to-br from-rose-50/50 to-orange-50/50 flex flex-col">
           <motion.div animate={pulseAnim} className="absolute -right-10 -bottom-10 text-rose-400/10"><ShieldAlert size={180} /></motion.div>
           
           <div className="flex items-center gap-3 mb-6 relative z-10">
              <motion.div animate={pulseAnim} className="p-3 bg-white/80 text-rose-500 rounded-2xl shadow-sm border border-white"><AlertTriangle size={22} /></motion.div>
              <div>
                 <h3 className="font-extrabold text-sm tracking-tight">Zona Kritis & Remedial</h3>
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Prioritas Bimbingan</p>
              </div>
           </div>

           <div className="flex flex-col gap-4 relative z-10 flex-1">
              {/* Box Alert */}
              <div className="bg-white/60 backdrop-blur-md rounded-2xl p-4 border border-white shadow-sm flex items-center justify-between">
                 <div>
                    <h2 className="text-3xl font-black text-rose-600 tracking-tighter leading-none mb-1">{stats.persenDibawah}%</h2>
                    <p className="text-[9px] font-bold text-slate-500 uppercase">Dibawah KKM ({STANDAR_KKM})</p>
                 </div>
                 <div className="text-right">
                    <h2 className="text-xl font-black text-slate-800 leading-none mb-1">{stats.dibawahKKM}</h2>
                    <p className="text-[9px] font-bold text-slate-500 uppercase">Siswa Teridentifikasi</p>
                 </div>
              </div>

              {/* List Remedial Mapel Terbanyak */}
              <div className="flex-1 bg-white/40 backdrop-blur-sm rounded-2xl p-4 border border-white shadow-inner overflow-hidden flex flex-col">
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Mapel Rawan Remedial</span>
                 <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
                    {[ { k: 'KLS 7', d: stats.k7.remedial[0] }, { k: 'KLS 8', d: stats.k8.remedial[0] }, { k: 'KLS 9', d: stats.k9.remedial[0] } ]
                       .filter(item => item.d && item.d.count > 0)
                       .map((item, idx) => (
                       <div key={idx} className="flex items-center justify-between bg-white/70 p-2.5 rounded-xl border border-white shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                          <div className="flex items-center gap-2">
                             <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{item.k}</span>
                             <span className="text-xs font-black text-slate-700">{item.d.nama}</span>
                          </div>
                          <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg">{item.d.count} Siswa</span>
                       </div>
                    ))}
                    {(!stats.k7.remedial[0] || stats.k7.remedial[0].count === 0) && 
                     (!stats.k8.remedial[0] || stats.k8.remedial[0].count === 0) && 
                     (!stats.k9.remedial[0] || stats.k9.remedial[0].count === 0) && (
                       <p className="text-[10px] text-slate-400 italic text-center mt-4">Data belum tersedia/semua tuntas.</p>
                    )}
                 </div>
              </div>
           </div>
        </GlassCard>
      )}

    </motion.div>
  );
}
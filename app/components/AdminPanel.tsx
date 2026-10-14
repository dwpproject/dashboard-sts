"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Eye, EyeOff, RefreshCw, 
  Download, Database, Table, 
  CheckCircle2, Search, FileUp, FileDown,
  AlertTriangle, Filter, ArrowUpDown, ChevronUp, ChevronDown,
  MessageSquare, School, PieChart, Activity, Volume2, VolumeX
} from 'lucide-react';
import * as XLSX from 'xlsx';
import DashboardStatistics from './DashboardStatistics';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  displaySettings: any;
  setDisplaySettings: React.Dispatch<React.SetStateAction<any>>;
  dashboardData?: any; 
  setDashboardData?: React.Dispatch<React.SetStateAction<any>>;
}

const EXCEL_HEADERS = [
  "No", "Kelas", "NIS", "NISN", "Nama", "JK", "Agm", "PP", "B.Ind", "Mtk", 
  "IPA", "IPS", "B.ING", "SBP", "PJOK", "Mulok", "Tik", "BK", "KODING", "JML", "RATA-RATA", "RANK"
];

const EXCEL_HEADERS_UMPAN_BALIK = [
  "Timestamp", "NAMA SISWA", "KELAS", 
  "Seberapa mudah penggunaan aplikasi Exambro saat ujian?", 
  "Apakah aplikasi berjalan lancar selama ujian berlangsung?", 
  "Apakah petunjuk penggunaan aplikasi mudah dipahami?", 
  "Apakah penggunaan Exambro membantu ujian berjalan lebih tertib?", 
  "Apakah Anda pernah mengalami kendala saat menggunakan Exambro?", 
  "Jika mengalami kendala, jelaskan kendala yang Anda alami!", 
  "Apa yang Anda sukai dari penggunaan Exambro saat ujian?", 
  "Apa yang perlu ditingkatkan dalam penggunaan Exambro pada ujian berikutnya?", 
  "Untuk kedepannya, apakah pelaksanaan STS sebaiknya tetap menggunakan aplikasi Exambro? ", 
  "Tuliskan alasannya!"
];

export default function AdminPanel({ 
  isOpen, 
  onClose, 
  displaySettings, 
  setDisplaySettings,
  dashboardData,
  setDashboardData
}: AdminPanelProps) {
  
  const [activeMenu, setActiveMenu] = useState<'7' | '8' | '9' | 'umpan_balik' | 'statistik'>('statistik');
  const [selectedRombel, setSelectedRombel] = useState<string>('SEMUA');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('NO');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  
  const [notification, setNotification] = useState<{
    type: 'success' | 'warning' | 'error';
    title: string;
    message: string;
  } | null>(null);

  const [localData, setLocalData] = useState<{ [key: string]: any[] }>({
    '7': [], '8': [], '9': []
  });

  const [umpanBalikData, setUmpanBalikData] = useState<any[]>([]);

  // Sound Refs
  const popSound = useRef<HTMLAudioElement | null>(null);
  const swishSound = useRef<HTMLAudioElement | null>(null);
  const successSound = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    popSound.current = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'); 
    swishSound.current = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'); 
    successSound.current = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'); 
  }, []);

  const playSound = (type: 'pop' | 'swish' | 'success') => {
    if (!soundEnabled) return;
    try {
      if (type === 'pop' && popSound.current) { popSound.current.currentTime = 0; popSound.current.play(); }
      if (type === 'swish' && swishSound.current) { swishSound.current.currentTime = 0; swishSound.current.play(); }
      if (type === 'success' && successSound.current) { successSound.current.currentTime = 0; successSound.current.play(); }
    } catch (e) { console.error('Audio play failed', e); }
  };

  useEffect(() => {
    if (isOpen) playSound('swish');
  }, [isOpen]);

  useEffect(() => {
    if (dashboardData) {
      setLocalData({ '7': dashboardData['7'] || [], '8': dashboardData['8'] || [], '9': dashboardData['9'] || [] });
      if (dashboardData['umpan_balik']) setUmpanBalikData(dashboardData['umpan_balik']);
    }
  }, [dashboardData]);

 // TAMBAHAN BARU: Fetch data Umpan Balik langsung dari MySQL saat Admin Panel dibuka
  useEffect(() => {
    async function fetchUmpanBalikFromDB() {
      try {
        const res = await fetch('/api/umpan-balik');
        
        // Cek apakah response berhasil (status 200-299)
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        // Ambil text dulu untuk mencegah error "Unexpected end of JSON input" jika response kosong
        const textResponse = await res.text();
        
        // Jika response kosong, tidak perlu di-parse ke JSON
        if (!textResponse) {
            console.warn("Response API umpan-balik kosong.");
            return;
        }

        const result = JSON.parse(textResponse);
        
        if (result.success && result.data) {
          setUmpanBalikData(result.data);
          // Sinkronkan juga ke state dashboard utama jika diperlukan
          if (setDashboardData) {
            setDashboardData((prev: any) => ({ ...prev, umpan_balik: result.data }));
          }
        } else {
             console.warn("Data umpan balik tidak ditemukan pada response API.");
        }
      } catch (err) {
        console.error("Gagal mengambil data umpan balik dari MySQL:", err);
      }
    }

    if (isOpen) {
      fetchUmpanBalikFromDB();
    }
  }, [isOpen, setDashboardData]);

  // LOGIKA BARU: Otomatis menutup notifikasi setelah 5 detik
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000); // 5000 ms = 5 detik

      // Membersihkan timer jika komponen di-unmount atau notifikasi berubah sebelum 5 detik
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleDownloadTemplate = (type: 'nilai' | 'umpan_balik') => {
    playSound('pop');
    if (type === 'nilai') {
      const sampleData = [{ "No": 1, "Kelas": "VII.1", "NIS": "18120", "NISN": "0136375933", "Nama": "ADRIAN JUNIANSYAH", "JK": "L", "Agm": 95.00, "PP": 85.00, "B.Ind": 93.00, "Mtk": 73.00, "IPA": 35.00, "IPS": 48.00, "B.ING": 80.00, "SBP": 48.00, "PJOK": 95.00, "Mulok": 68.00, "Tik": 78.00, "BK": 100.00, "KODING": 68.00, "JML": 1137.00, "RATA-RATA": 87.46, "RANK": 1 }];
      const worksheet = XLSX.utils.json_to_sheet(sampleData, { header: EXCEL_HEADERS });
      const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, worksheet, "Data STS"); XLSX.writeFile(workbook, "Template_Apk_Nilai_STS.xlsx");
    } else {
      const worksheet = XLSX.utils.json_to_sheet([], { header: EXCEL_HEADERS_UMPAN_BALIK });
      const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, worksheet, "Umpan Balik"); XLSX.writeFile(workbook, "Template_Umpan_Balik_STS.xlsx");
    }
  };

  const handleExportData = (grade: '7' | '8' | '9') => {
    playSound('pop');
    const data = localData[grade];
    if (!data || data.length === 0) { setNotification({ type: 'warning', title: 'Export Gagal', message: `Tidak ada data nilai untuk Kelas ${grade}.` }); return; }
    const worksheet = XLSX.utils.json_to_sheet(data); const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, worksheet, `Kelas ${grade}`); XLSX.writeFile(workbook, `Data_Nilai_STS_Kelas_${grade}.xlsx`);
  };

  const handleExportUB = () => {
    playSound('pop');
    if (umpanBalikData.length === 0) { setNotification({ type: 'warning', title: 'Export Gagal', message: 'Tidak ada data umpan balik.' }); return; }
    const worksheet = XLSX.utils.json_to_sheet(umpanBalikData); const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, worksheet, "Umpan Balik"); XLSX.writeFile(workbook, "Data_Umpan_Balik_STS.xlsx");
  };

  const calculateStudentScores = (row: any) => {
    const uniqueKeys = ['Agm', 'PP', 'B.Ind', 'Mtk', 'IPA', 'IPS', 'B.ING', 'SBP', 'PJOK', 'Mulok', 'Tik', 'BK', 'KODING'];
    let total = 0, count = 0;
    uniqueKeys.forEach(subj => {
      let val = row[subj] ?? row[subj.toLowerCase()] ?? row[subj.toUpperCase()] ?? 0;
      if (subj === 'PP') val = row['PP'] ?? row['pp'] ?? row['P.Panca'] ?? row['p.panca'] ?? row['P.Pancasila'] ?? row['P. Pancasila'] ?? row['PKn'] ?? row['pkn'] ?? 0;
      else if (subj === 'SBP') val = row['SBP'] ?? row['sbp'] ?? row['SB'] ?? row['sb'] ?? row['SENI BUD'] ?? 0;
      const num = parseFloat(val); if (!isNaN(num)) { total += num; count++; }
    });
    return { jml: total, rataRata: parseFloat((count > 0 ? total / count : 0).toFixed(2)) };
  };

  const processUpload = async (file: File, grade?: '7'|'8'|'9') => {
    playSound('swish');
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result;
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        let parsedData: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: "" });

        if (parsedData.length === 0) { 
          setNotification({ type: 'error', title: 'File Kosong', message: 'Excel tidak memiliki data.' }); 
          return; 
        }

        if (grade) {
          parsedData = parsedData.filter(row => String(row.Nama || row.nama || '').trim() !== '' && String(row.Nama || row.nama || '').trim() !== '-').map(row => {
            const calc = calculateStudentScores(row); return { ...row, JML: calc.jml, JUMLAH: calc.jml, "RATA-RATA": calc.rataRata, RATA2: calc.rataRata };
          });
          let existingData = [...(localData[grade] || [])];
          let updatedCount = 0, newCount = 0;
          parsedData.forEach((newItem) => {
            const namaStr = String(newItem.Nama || newItem.nama || '').trim().toLowerCase();
            if (!namaStr) return;
            const index = existingData.findIndex(item => String(item.Nama || item.nama || '').trim().toLowerCase() === namaStr);
            if (index !== -1) { existingData[index] = { ...existingData[index], ...newItem }; updatedCount++; } 
            else { existingData.push(newItem); newCount++; }
          });
          
          setLocalData(prev => ({ ...prev, [grade]: existingData }));
          if (setDashboardData) setDashboardData((prev: any) => ({ ...prev, [grade]: existingData }));
          
          try { 
            await fetch('/api/siswa', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ grade, students: existingData }) }); 
          } catch (dbErr) { console.error(dbErr); }
          
          setActiveMenu(grade); setSelectedRombel('SEMUA');
          playSound('success');
          setNotification({ type: 'success', title: 'Sinkronisasi Berhasil!', message: `Memproses ${parsedData.length} data (${newCount} baru, ${updatedCount} update).` });
        
        } else {
          setUmpanBalikData(parsedData);
          if (setDashboardData) setDashboardData((prev: any) => ({ ...prev, umpan_balik: parsedData }));
          
          try { 
            const response = await fetch('/api/umpan-balik', { 
              method: 'POST', 
              headers: { 
                 'Content-Type': 'application/json',
                 'Accept': 'application/json'
              }, 
              body: JSON.stringify({ data: parsedData }) 
            }); 
            
            const responseData = await response.json();

            if (!response.ok || !responseData.success) {
               throw new Error(responseData.message || "Gagal menyimpan ke database");
            }

            setActiveMenu('umpan_balik'); setSelectedRombel('SEMUA');
            playSound('success');
            setNotification({ type: 'success', title: 'Import Berhasil!', message: `Berhasil memuat dan menyimpan ${parsedData.length} respons umpan balik ke MySQL.` });
          } catch (dbErr: any) { 
            console.error("API Umpan Balik Error:", dbErr); 
            setActiveMenu('umpan_balik'); setSelectedRombel('SEMUA');
            setNotification({ type: 'warning', title: 'MySQL Sinkronisasi Gagal', message: dbErr.message || 'Data dimuat ke layar, namun gagal disimpan permanen ke database.' });
          }
        }
      } catch (err) {
        setNotification({ type: 'error', title: 'Format Tidak Sesuai', message: 'Gagal membaca file.' });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, grade: '7' | '8' | '9') => { if(e.target.files?.[0]) processUpload(e.target.files[0], grade); e.target.value = ''; };
  const handleFileUploadUB = (e: React.ChangeEvent<HTMLInputElement>) => { if(e.target.files?.[0]) processUpload(e.target.files[0]); e.target.value = ''; };

  const currentGradeData = activeMenu !== 'umpan_balik' && activeMenu !== 'statistik' ? (localData[activeMenu] || []) : [];
  const availableRombels = activeMenu !== 'umpan_balik' && activeMenu !== 'statistik'
    ? Array.from(new Set(currentGradeData.map(row => String(row.Kelas || '').trim()).filter(Boolean)))
    : activeMenu === 'umpan_balik' ? Array.from(new Set(umpanBalikData.map(row => String(row.kelas || row.KELAS || '').trim()).filter(Boolean))) : [];

  const handleSort = (field: string) => { playSound('pop'); if (sortField === field) setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc'); else { setSortField(field); setSortDirection('asc'); } };

  const filteredDataNilai = useMemo(() => {
    if (activeMenu === 'umpan_balik' || activeMenu === 'statistik') return [];
    let result = currentGradeData.filter(row => {
      const matchRombel = selectedRombel === 'SEMUA' || String(row.Kelas || '').trim() === selectedRombel;
      const matchSearch = Object.values(row).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase()));
      return matchRombel && matchSearch;
    });
    result.sort((a, b) => {
      let valA: any = a[sortField] ?? 0; let valB: any = b[sortField] ?? 0;
      if (sortField === 'JUMLAH') { valA = a.JML || 0; valB = b.JML || 0; }
      if (sortField === 'RATA2') { valA = a["RATA-RATA"] || 0; valB = b["RATA-RATA"] || 0; }
      if (typeof valA === 'string') return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      return sortDirection === 'asc' ? valA - valB : valB - valA;
    });
    return result;
  }, [currentGradeData, selectedRombel, searchTerm, sortField, sortDirection, activeMenu]);

  const filteredDataUB = useMemo(() => {
    if (activeMenu !== 'umpan_balik') return [];
    return umpanBalikData.filter(row => {
      const matchRombel = selectedRombel === 'SEMUA' || String(row.kelas || row.KELAS || '').trim() === selectedRombel;
      const matchSearch = Object.values(row).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase()));
      return matchRombel && matchSearch;
    });
  }, [umpanBalikData, selectedRombel, searchTerm, activeMenu]);

  const menuItems = [
    { id: 'statistik', label: 'Statistik', icon: <PieChart size={14} /> },
    { id: '7', label: `Kelas 7`, badge: localData['7']?.length || 0, icon: <School size={14} /> },
    { id: '8', label: `Kelas 8`, badge: localData['8']?.length || 0, icon: <School size={14} /> },
    { id: '9', label: `Kelas 9`, badge: localData['9']?.length || 0, icon: <School size={14} /> },
    { id: 'umpan_balik', label: `Umpan Balik`, badge: umpanBalikData.length, icon: <MessageSquare size={14} /> }
  ] as const;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, backdropFilter: "blur(0px)" }} 
          animate={{ opacity: 1, backdropFilter: "blur(24px)" }} 
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[100] bg-slate-900/40 flex items-center justify-center p-2 md:p-6 font-sans text-slate-800 select-none overflow-hidden"
        >
          <motion.div 
            layout
            initial={{ opacity: 0, scale: 0.9, y: 40, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.95, y: 20, filter: "blur(10px)" }}
            transition={{ type: "spring", damping: 30, stiffness: 250, mass: 0.8 }}
            className="w-full h-full max-w-[1600px] bg-white/70 border border-white/60 shadow-[0_8px_40px_rgba(0,0,0,0.12)] rounded-[2.5rem] flex flex-col overflow-hidden relative"
          >
            {/* COMPACT GLASS HEADER */}
            <header className="px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-white/50 shrink-0 bg-white/40">
              <div className="flex items-center gap-3 w-full md:w-auto">
                <motion.div 
                  whileHover={{ rotate: 180, scale: 1.1 }} 
                  transition={{ type: "spring", stiffness: 200 }} 
                  className="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md cursor-pointer"
                  onClick={() => playSound('pop')}
                >
                  <Activity size={20} />
                </motion.div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 tracking-tight">
                    Pusat Data STS
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 uppercase tracking-wider border border-emerald-200/50 shadow-inner">Live</span>
                  </h2>
                </div>
              </div>

              {/* SEAMLESS ANIMATED TABS */}
              <div className="flex bg-white/50 p-1.5 rounded-2xl border border-white/60 shadow-sm w-full md:w-auto overflow-x-auto no-scrollbar relative z-10">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { playSound('pop'); setActiveMenu(item.id as any); setSelectedRombel('SEMUA'); setSearchTerm(''); }}
                    className={`relative px-4 py-2.5 flex items-center gap-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                      activeMenu === item.id ? 'text-indigo-700' : 'text-slate-500 hover:text-slate-800 hover:bg-white/20'
                    }`}
                  >
                    {activeMenu === item.id && (
                      <motion.div 
                        layoutId="activeAdminTab" 
                        className="absolute inset-0 bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] border border-white/80"
                        transition={{ type: "spring", stiffness: 400, damping: 35 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      {item.icon} {item.label} 
                      {item.badge !== undefined && (
                        <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[9px] ${activeMenu === item.id ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200/50 text-slate-500'}`}>{item.badge}</span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
              
              <div className="flex items-center gap-2">
                <motion.button 
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={() => setSoundEnabled(!soundEnabled)} 
                  className="p-2.5 rounded-xl bg-white/80 text-slate-500 hover:text-slate-800 transition-colors shadow-sm border border-slate-200/50"
                  title="Toggle Sound"
                >
                  {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </motion.button>

                <AnimatePresence mode="popLayout">
                  {activeMenu !== 'statistik' && (
                    <motion.button 
                      initial={{ opacity: 0, scale: 0.8, width: 0 }} animate={{ opacity: 1, scale: 1, width: 'auto' }} exit={{ opacity: 0, scale: 0.8, width: 0 }}
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={activeMenu === 'umpan_balik' ? handleExportUB : () => handleExportData(activeMenu)} 
                      className="hidden md:flex px-4 py-2.5 rounded-xl bg-white/80 text-slate-700 font-bold text-xs hover:bg-white transition-colors items-center gap-2 shadow-sm border border-slate-200/50"
                    >
                      <Download size={14} /> Export
                    </motion.button>
                  )}
                </AnimatePresence>

                <motion.button 
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => { playSound('swish'); onClose(); }} 
                  className="hidden md:flex px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors items-center gap-2 shadow-lg shadow-slate-900/20"
                >
                  Tutup Panel <X size={14} />
                </motion.button>
              </div>
            </header>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 p-4 flex flex-col lg:flex-row gap-4 min-h-0 relative">
              
              {/* NOTIFICATION TOAST */}
              <AnimatePresence>
                {notification && (
                  <motion.div 
                    initial={{ opacity: 0, y: -40, scale: 0.8, filter: "blur(10px)" }} 
                    animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }} 
                    exit={{ opacity: 0, y: -20, scale: 0.9, filter: "blur(5px)" }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="absolute top-4 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full p-3 rounded-2xl shadow-2xl border border-white/80 backdrop-blur-3xl bg-white/95 flex items-center gap-3"
                  >
                    <div className={`p-2 rounded-xl shrink-0 ${notification.type === 'success' ? 'bg-emerald-100 text-emerald-600' : notification.type === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'}`}>
                      {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-black text-slate-800">{notification.title}</h4>
                      <p className="text-[10px] font-medium text-slate-500 mt-0.5 leading-tight">{notification.message}</p>
                    </div>
                    <button onClick={() => { playSound('pop'); setNotification(null); }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"><X size={14} /></button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* BENTO LEFT CONTROLS (Smooth Collapsible) */}
              <AnimatePresence mode="popLayout">
                {activeMenu !== 'statistik' && (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, width: 0, x: -50, filter: "blur(10px)" }} 
                    animate={{ opacity: 1, width: '320px', x: 0, filter: "blur(0px)" }} 
                    exit={{ opacity: 0, width: 0, x: -50, filter: "blur(10px)" }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="flex flex-col gap-4 min-h-0 overflow-y-auto no-scrollbar shrink-0"
                  >
                    <motion.div layout className="bg-white/50 rounded-[2rem] p-5 border border-white/60 shadow-sm backdrop-blur-md flex flex-col gap-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg"><Database size={14} /></div>
                        <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-700">Data Importer</h4>
                      </div>
                      <div className="flex flex-col gap-2">
                        <motion.label whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="cursor-pointer py-3.5 bg-indigo-600 text-white text-[11px] font-bold rounded-2xl flex items-center justify-center gap-2 shadow-md hover:bg-indigo-700 transition-all">
                          <input type="file" className="hidden" accept=".xlsx, .xls" onChange={activeMenu === 'umpan_balik' ? handleFileUploadUB : (e) => handleFileUpload(e, activeMenu)} />
                          <FileUp size={16} /> Import File Excel
                        </motion.label>
                        <button onClick={() => handleDownloadTemplate(activeMenu === 'umpan_balik' ? 'umpan_balik' : 'nilai')} className="py-3 border-2 border-dashed border-slate-300/50 rounded-2xl text-[10px] font-bold text-slate-500 hover:text-slate-800 hover:bg-white/50 transition-colors flex justify-center items-center gap-1.5">
                           Unduh Format Template
                        </button>
                      </div>
                    </motion.div>

                    <motion.div layout className="bg-white/50 rounded-[2rem] p-5 border border-white/60 shadow-sm backdrop-blur-md flex flex-col gap-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg"><Filter size={14} /></div>
                        <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-700">Pencarian & Filter</h4>
                      </div>
                      <div className="flex flex-col gap-3">
                        <div className="relative">
                          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input type="text" placeholder="Cari data..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/80 border border-white/60 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-inner transition-all" />
                        </div>
                        <select value={selectedRombel} onChange={(e) => { playSound('pop'); setSelectedRombel(e.target.value); }} className="w-full px-4 py-3 rounded-2xl bg-white/80 border border-white/60 text-xs font-black text-slate-700 focus:outline-none cursor-pointer shadow-inner appearance-none">
                          <option value="SEMUA">Semua Rombel</option>
                          {availableRombels.map((rombel, i) => <option key={i} value={rombel}>{rombel}</option>)}
                        </select>
                      </div>
                    </motion.div>

                    {activeMenu !== 'umpan_balik' && (
                      <motion.div layout className="bg-white/50 rounded-[2rem] p-5 border border-white/60 shadow-sm backdrop-blur-md flex flex-col gap-3">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg"><Eye size={14} /></div>
                          <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-700">Visibilitas Widget</h4>
                        </div>
                        <div className="flex flex-col gap-2">
                          {[ { key: 'showDemografi', label: 'Demografi & Rekap' }, { key: 'showZonaPerhatian', label: 'Zona Perhatian' }, { key: 'showCapaian', label: 'Capaian STS' }, { key: 'showSebaran', label: 'Sebaran Mapel' } ].map((setting) => (
                            <div key={setting.key} className="flex items-center justify-between p-2.5 rounded-2xl bg-white/60 border border-white/80">
                              <span className="text-[10px] font-bold text-slate-600">{setting.label}</span>
                              <button onClick={() => { playSound('pop'); setDisplaySettings((prev: any) => ({ ...prev, [setting.key]: !prev[setting.key] })); }} className={`w-9 h-5 rounded-full p-0.5 transition-colors ${displaySettings[setting.key] ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                <motion.div layout className="w-4 h-4 bg-white rounded-full shadow-sm" animate={{ x: displaySettings[setting.key] ? 16 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* BENTO RIGHT CONTENT (Smooth Transitioning Data Area) */}
              <motion.div 
                layout
                className="flex-1 bg-white/60 rounded-[2rem] border border-white/60 shadow-sm backdrop-blur-xl flex flex-col min-h-0 overflow-hidden relative"
              >
                <AnimatePresence mode="wait">
                  {activeMenu === 'statistik' ? (
                    <motion.div 
                      key="stats-view"
                      initial={{ opacity: 0, scale: 0.98, filter: "blur(5px)" }}
                      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                      exit={{ opacity: 0, scale: 0.98, filter: "blur(5px)" }}
                      transition={{ duration: 0.3 }}
                      className="flex-1 overflow-y-auto no-scrollbar relative rounded-[2rem] p-1 h-full"
                    >
                      <DashboardStatistics 
                        dashboardData={{ '7': localData['7'], '8': localData['8'], '9': localData['9'], 'umpan_balik': umpanBalikData }}
                        displaySettings={displaySettings}
                      />
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="table-view"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="flex-1 flex flex-col min-h-0 overflow-hidden h-full"
                    >
                      <div className="flex-1 overflow-auto no-scrollbar relative p-4">
                        {activeMenu === 'umpan_balik' ? (
                          filteredDataUB.length === 0 ? (
                             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60"><MessageSquare size={48} className="mb-3 opacity-50"/> <p className="text-sm font-bold">Data Umpan Balik Kosong</p></motion.div>
                          ) : (
                            <div className="bg-white/50 rounded-[1.5rem] border border-white/60 overflow-hidden shadow-sm">
                              <table className="w-full text-left border-collapse text-[11px] whitespace-nowrap">
                                <thead>
                                  <tr className="bg-white/80 text-slate-500 font-black border-b border-slate-200/50 sticky top-0 backdrop-blur-2xl z-10 shadow-sm">
                                    {["NO", "NAMA SISWA", "KELAS", "KEMUDAHAN", "KELANCARAN", "KETERTIBAN"].map(h => <th key={h} className="p-4 border-r border-slate-200/30 last:border-0">{h}</th>)}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100/50">
                                  {filteredDataUB.map((row, idx) => (
                                    <motion.tr initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx > 15 ? 0 : idx * 0.02 }} key={idx} className="hover:bg-white/80 transition-colors text-slate-600 font-semibold group cursor-default">
                                      <td className="p-4 text-slate-400 group-hover:text-indigo-500 transition-colors">{idx + 1}</td>
                                      <td className="p-4 font-bold text-slate-800">{row.nama_siswa || row["NAMA SISWA"] || row["Nama"] || '-'}</td>
                                      <td className="p-4 text-indigo-600 font-black">{row.kelas || row.KELAS || '-'}</td>
                                      <td className="p-4 text-center">
                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${Number(row.kemudahan || row["Seberapa mudah penggunaan aplikasi Exambro saat ujian?"]) >= 4 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                          {row.kemudahan || row["Seberapa mudah penggunaan aplikasi Exambro saat ujian?"] || '-'}
                                        </span>
                                      </td>
                                      <td className="p-4 text-center">
                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${Number(row.kelancaran || row["Apakah aplikasi berjalan lancar selama ujian berlangsung?"]) >= 4 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                          {row.kelancaran || row["Apakah aplikasi berjalan lancar selama ujian berlangsung?"] || '-'}
                                        </span>
                                      </td>
                                      <td className="p-4 text-center">
                                        <span className="font-bold text-slate-700">
                                          {row.ketertiban || row["Apakah penggunaan Exambro membantu ujian berjalan lebih tertib?"] || '-'}
                                        </span>
                                      </td>
                                    </motion.tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )
                        ) : filteredDataNilai.length === 0 ? (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60"><Table size={48} className="mb-3 opacity-50"/> <p className="text-sm font-bold">Data Nilai Kosong</p></motion.div>
                        ) : (
                          <div className="bg-white/50 rounded-[1.5rem] border border-white/60 overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse text-[11px] whitespace-nowrap">
                              <thead>
                                <tr className="bg-white/80 text-slate-500 font-black border-b border-slate-200/50 sticky top-0 backdrop-blur-2xl z-10 shadow-sm">
                                  {[ { label: 'NO', key: 'NO' }, { label: 'KELAS', key: 'KELAS' }, { label: 'NAMA', key: 'NAMA LENGKAP' }, { label: 'AGM', key: 'AGM' }, { label: 'PP', key: 'PP' }, { label: 'B.IND', key: 'B.IND' }, { label: 'MTK', key: 'MTK' }, { label: 'IPA', key: 'IPA' }, { label: 'IPS', key: 'IPS' }, { label: 'JML', key: 'JUMLAH', align: 'right' }, { label: 'RATA2', key: 'RATA2', align: 'right' } ].map((col) => (
                                    <th key={col.key} onClick={() => handleSort(col.key)} className={`p-4 border-r border-slate-200/30 cursor-pointer hover:bg-white/60 transition-colors group ${col.align === 'right' ? 'text-right' : 'text-left'}`}>
                                      <div className={`flex items-center gap-1.5 ${col.align === 'right' ? 'justify-end' : 'justify-between'}`}>
                                        <span>{col.label}</span>
                                        <span className="text-slate-400 group-hover:text-indigo-500 transition-colors">
                                          {sortField === col.key ? (sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ArrowUpDown size={10} className="opacity-20 group-hover:opacity-100" />}
                                        </span>
                                      </div>
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100/50">
                                {filteredDataNilai.map((row, idx) => (
                                  <motion.tr initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx > 15 ? 0 : idx * 0.02 }} key={idx} className="hover:bg-white/80 transition-colors text-slate-600 font-semibold group cursor-default">
                                    <td className="p-4 text-slate-400 font-mono group-hover:text-indigo-500 transition-colors">{row.no_urut || row.No || idx + 1}</td>
                                    <td className="p-4 text-indigo-600 font-black">{row.kelas || row.Kelas || '-'}</td>
                                    <td className="p-4 font-bold text-slate-800">{row.nama || row.Nama || '-'}</td>
                                    <td className="p-4">{row.agm ?? row.Agm ?? '-'}</td>
                                    <td className="p-4">{row.pp ?? row.PP ?? '-'}</td>
                                    <td className="p-4">{row.b_ind ?? row["B.Ind"] ?? '-'}</td>
                                    <td className="p-4">{row.mtk ?? row.Mtk ?? '-'}</td>
                                    <td className="p-4">{row.ipa ?? row.IPA ?? '-'}</td>
                                    <td className="p-4">{row.ips ?? row.IPS ?? '-'}</td>
                                    <td className="p-4 text-right font-black text-emerald-600">{row.JML || row.JUMLAH || calculateStudentScores(row).jml}</td>
                                    <td className="p-4 text-right font-black text-sky-600">{row["RATA-RATA"] || row.RATA2 || calculateStudentScores(row).rataRata.toFixed(2)}</td>
                                  </motion.tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </main>
          </motion.div>
          
          <style dangerouslySetInnerHTML={{__html: ` .no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } `}} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
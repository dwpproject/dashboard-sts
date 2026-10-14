"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Key, Eye, EyeOff, X, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';

interface AdminLoginProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export default function AdminLogin({ isOpen, onClose, onLoginSuccess }: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorAnim, setErrorAnim] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  // Validasi login admin
  if (username === 'admin' && password === 'admin123') {
    onLoginSuccess();
  } else {
    setErrorAnim(true);
    setTimeout(() => setErrorAnim(false), 600);
  }
};

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 font-sans select-none"
      >
        {/* Latar Belakang Cahaya Animasi Visual */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute w-[500px] h-[500px] bg-gradient-to-tr from-[#00BCD4]/30 via-indigo-500/20 to-purple-500/30 rounded-full blur-3xl pointer-events-none"
        />

        {/* Kotak Utama Panel Login */}
        <motion.div 
          initial={{ scale: 0.85, opacity: 0, y: 30 }}
          animate={{ 
            scale: 1, 
            opacity: 1, 
            y: errorAnim ? [0, -10, 10, -10, 10, 0] : 0 
          }}
          exit={{ scale: 0.85, opacity: 0, y: 30 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="bg-white/90 backdrop-blur-3xl rounded-[36px] p-8 max-w-md w-full shadow-[0_25px_80px_rgba(0,188,212,0.25)] border border-white relative z-10 overflow-hidden"
        >
          {/* Tombol Tutup */}
          <motion.button 
            whileHover={{ scale: 1.1, rotate: 90, backgroundColor: "#f1f5f9" }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose} 
            className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer shadow-xs"
          >
            <X size={18} />
          </motion.button>

          <div className="flex flex-col items-center text-center mb-6">
            <motion.div 
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="p-4 rounded-3xl bg-gradient-to-br from-[#00BCD4]/20 to-teal-500/20 text-[#00BCD4] shadow-inner border border-[#00BCD4]/30 mb-3"
            >
              <ShieldCheck size={32} />
            </motion.div>
            
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-[#00BCD4]/10 text-[#00BCD4] border border-[#00BCD4]/20 flex items-center gap-1.5 mb-1">
              <Sparkles size={12} /> Autentikasi Keamanan Sistem
            </span>
            <h3 className="text-2xl font-black text-slate-900">Panel Administrator</h3>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">Masukkan kredensial akses untuk mengelola data sekolah</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Input Username */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <UserCheck size={14} className="text-[#00BCD4]" /> Username Admin
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: admin"
                  required
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-50/90 border border-slate-200 text-sm font-bold text-slate-800 focus:bg-white focus:border-[#00BCD4] focus:ring-4 focus:ring-[#00BCD4]/15 focus:outline-none transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* Input Password dengan Show/Hide */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Key size={14} className="text-[#00BCD4]" /> Password Akses
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-4 pr-12 py-3.5 rounded-2xl bg-slate-50/90 border border-slate-200 text-sm font-bold text-slate-800 focus:bg-white focus:border-[#00BCD4] focus:ring-4 focus:ring-[#00BCD4]/15 focus:outline-none transition-all shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors cursor-pointer"
                  title={showPassword ? "Sembunyikan Password" : "Tampilkan Password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Tombol Aksi */}
            <motion.button 
              whileHover={{ scale: 1.02, backgroundColor: "#00acc1" }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              className="w-full py-4 rounded-2xl bg-[#00BCD4] text-white font-black text-sm mt-2 shadow-xl shadow-[#00BCD4]/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock size={16} /> Masuk Panel Sistem
            </motion.button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <p className="text-[10px] font-bold text-slate-400">
              SMP Negeri 01 Belitang • Sistem Informasi Akademik Terpadu
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
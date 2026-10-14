import { NextResponse } from 'next/server';
import pool from '@/lib/db'; // Sesuaikan path koneksi database MySQL Anda

// =======================================================
// 1. FUNGSI POST (Untuk IMPORT DATA DARI EXCEL KE MYSQL)
// =======================================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const dataArray = body.data;

    if (!dataArray || !Array.isArray(dataArray) || dataArray.length === 0) {
      return NextResponse.json({ success: false, message: 'Format data Excel tidak valid atau kosong' }, { status: 400 });
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Opsional: Jika Anda ingin menghapus data lama setiap import Excel baru
      await connection.query('TRUNCATE TABLE umpan_balik');

      // Siapkan iterasi untuk Bulk Insert
      for (const row of dataArray) {
        // Ambil data berdasarkan nama kolom Excel persis seperti yang ada di forms.
        // Jika undefined, atur sebagai NULL
        const timestamp = row['Timestamp'] || null;
        const nama = row['NAMA SISWA'] || null;
        const kelas = row['KELAS'] || null;
        const kemudahan = row['Seberapa mudah penggunaan aplikasi Exambro saat ujian?'] || null;
        const kelancaran = row['Apakah aplikasi berjalan lancar selama ujian berlangsung?'] || null;
        const pemahaman = row['Apakah petunjuk penggunaan aplikasi mudah dipahami?'] || null;
        const ketertiban = row['Apakah penggunaan Exambro membantu ujian berjalan lebih tertib?'] || null;
        const freq_kendala = row['Apakah Anda pernah mengalami kendala saat menggunakan Exambro?'] || null;
        const desc_kendala = row['Jika mengalami kendala, jelaskan kendala yang Anda alami!'] || null;
        const disukai = row['Apa yang Anda sukai dari penggunaan Exambro saat ujian?'] || null;
        const perbaikan = row['Apa yang perlu ditingkatkan dalam penggunaan Exambro pada ujian berikutnya?'] || null;
        const lanjut = row['Untuk kedepannya, apakah pelaksanaan STS sebaiknya tetap menggunakan aplikasi Exambro? '] || row['Untuk kedepannya, apakah pelaksanaan STS sebaiknya tetap menggunakan aplikasi Exambro?'] || null;
        const alasan = row['Tuliskan alasannya!'] || null;

        // Pastikan Anda sudah membuat tabel `umpan_balik` di PHPMyAdmin dengan struktur kolom-kolom ini
        const query = `
          INSERT INTO umpan_balik 
          (timestamp, nama_siswa, kelas, kemudahan, kelancaran, pemahaman, ketertiban, frekuensi_kendala, deskripsi_kendala, disukai, perbaikan, lanjut_exambro, alasan) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        await connection.query(query, [
          timestamp, nama, kelas, kemudahan, kelancaran, pemahaman, ketertiban, freq_kendala, desc_kendala, disukai, perbaikan, lanjut, alasan
        ]);
      }

      await connection.commit();
      connection.release();

      return NextResponse.json({ success: true, message: 'Data umpan balik berhasil disimpan ke MySQL' });

    } catch (dbError: any) {
      await connection.rollback();
      connection.release();
      console.error("Kesalahan Database Umpan Balik:", dbError);
      return NextResponse.json({ success: false, message: `Kesalahan Database: ${dbError.message}` }, { status: 500 });
    }

  } catch (error: any) {
    console.error('API Route Error:', error);
    return NextResponse.json({ success: false, message: 'Kesalahan Server Internal saat memproses request' }, { status: 500 });
  }
}

// =======================================================
// 2. FUNGSI GET (Untuk MENGAMBIL DATA DARI MYSQL KE LAYAR)
// =======================================================
export async function GET() {
  try {
    const connection = await pool.getConnection();
    
    // Ambil seluruh data dari tabel umpan_balik
    const [rows] = await connection.query('SELECT * FROM umpan_balik');
    
    connection.release();

    // Kembalikan ke front-end (AdminPanel) dalam format JSON yang valid
    return NextResponse.json({ 
      success: true, 
      data: rows 
    });

  } catch (error: any) {
    console.error('Gagal mengambil data umpan_balik:', error);
    return NextResponse.json(
      { success: false, message: 'Kesalahan saat mengambil data dari database', data: [] }, 
      { status: 500 }
    );
  }
}
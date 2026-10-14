import { NextResponse } from 'next/server';
import db from '@/lib/db';

// GET: Mengambil data dari MySQL untuk dikirim ke Dashboard & Admin Panel
export async function GET() {
  try {
    const [rows] = await db.query('SELECT * FROM siswa_nilai');
    
    // Kelompokkan data berdasarkan jenjang kelas (7, 8, 9)
    const groupedData = { '7': [], '8': [], '9': [] };
    
    rows.forEach(row => {
      const jenjang = String(row.jenjang || row.Kelas?.charAt(0) || '7');
      if (groupedData[jenjang]) {
        groupedData[jenjang].push(row);
      }
    });

    return NextResponse.json({ success: true, data: groupedData });
  } catch (error) {
    console.error("Gagal mengambil data database:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST: Menyimpan data yang diimport dari Excel ke MySQL
export async function POST(request) {
  try {
    const { grade, students } = await request.json();

    if (!students || !Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ success: false, message: 'Data siswa kosong atau tidak valid.' }, { status: 400 });
    }

    // Hapus data lama berdasarkan jenjang agar tidak terjadi penumpukan/duplikasi saat re-import
    await db.query('DELETE FROM siswa_nilai WHERE jenjang = ?', [grade]);

    // Simpan data siswa ke database MySQL sesuai kelasnya
    for (const student of students) {
      const kelas = student.kelas || student.Kelas || '';
      const nama = student.nama || student.Nama || '';
      const jk = student.jk || student.JK || '';
      const nisn = student.nisn || student.NISN || '';
      const agm = student.agm || student.Agm || 0;
      const pp = student.pp || student.PP || student["P.Panca"] || student["P.Pancasila"] || student.pkn || student.PKn || 0;
      const b_ind = student.b_ind || student["B.Ind"] || student["B.INDO"] || 0;
      const mtk = student.mtk || student.Mtk || student.MTK || 0;
      const ipa = student.ipa || student.IPA || 0;
      const ips = student.ips || student.IPS || 0;
      const b_ing = student.b_ing || student["B.ING"] || student["B.Ing"] || 0;
      const sbp = student.sbp || student.SBP || student.sb || student.SB || 0;
      const pjok = student.pjok || student.PJOK || 0;
      const mulok = student.mulok || student.Mulok || 0;
      const tik = student.tik || student.Tik || student.TIK || 0;
      const bk = student.bk || student.BK || 0;
      const koding = student.koding || student.KODING || student.Koding || 0;
      const jml = student.jml || student.JML || 0;
      const rata_rata = student.rata_rata || student["RATA-RATA"] || student.RATA2 || 0;
      const rank = student.rank || student.RANK || 0;

      await db.query(
        `INSERT INTO siswa_nilai (jenjang, kelas, nama, jk, nisn, agm, pp, b_ind, mtk, ipa, ips, b_ing, sbp, pjok, mulok, tik, bk, koding, jml, rata_rata, rank) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          grade,
          kelas,
          nama,
          jk,
          nisn,
          agm,
          pp,
          b_ind,
          mtk,
          ipa,
          ips,
          b_ing,
          sbp,
          pjok,
          mulok,
          tik,
          bk,
          koding,
          jml,
          rata_rata,
          rank
        ]
      );
    }

    return NextResponse.json({ success: true, message: 'Data berhasil disimpan ke database.' });
  } catch (error) {
    console.error("Gagal menyimpan data ke database:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
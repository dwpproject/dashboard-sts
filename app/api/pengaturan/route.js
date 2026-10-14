import { NextResponse } from 'next/server';
import db from '../../../lib/db';

// Fungsi memastikan tabel pengaturan selalu tersedia di MySQL
async function ensureTableExists() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS pengaturan (
      id INT PRIMARY KEY DEFAULT 1,
      auto_slide_enabled TINYINT(1) NOT NULL DEFAULT 1,
      slide_interval_sec INT NOT NULL DEFAULT 15,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
}

export async function GET() {
  try {
    await ensureTableExists();
    const [rows] = await db.query('SELECT * FROM pengaturan WHERE id = 1');

    if (!rows || rows.length === 0) {
      await db.query('INSERT INTO pengaturan (id, auto_slide_enabled, slide_interval_sec) VALUES (1, 1, 15)');
      return NextResponse.json({
        success: true,
        data: { autoSlideEnabled: true, slideIntervalSec: 15 }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        autoSlideEnabled: Boolean(rows[0].auto_slide_enabled),
        slideIntervalSec: Number(rows[0].slide_interval_sec) || 15
      }
    });
  } catch (error) {
    console.error('Gagal mengambil pengaturan dari MySQL:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await ensureTableExists();
    const body = await request.json();
    const enabled = body.autoSlideEnabled ? 1 : 0;
    const interval = Math.max(3, parseInt(body.slideIntervalSec, 10) || 15);

    await db.query(
      `INSERT INTO pengaturan (id, auto_slide_enabled, slide_interval_sec)
       VALUES (1, ?, ?)
       ON DUPLICATE KEY UPDATE
       auto_slide_enabled = VALUES(auto_slide_enabled),
       slide_interval_sec = VALUES(slide_interval_sec)`,
      [enabled, interval]
    );

    return NextResponse.json({
      success: true,
      data: { autoSlideEnabled: Boolean(enabled), slideIntervalSec: interval }
    });
  } catch (error) {
    console.error('Gagal menyimpan pengaturan ke MySQL:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
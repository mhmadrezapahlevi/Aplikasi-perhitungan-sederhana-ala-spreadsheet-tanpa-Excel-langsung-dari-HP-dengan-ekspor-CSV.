# Lembar_hitung
# Aplikasi perhitungan sederhana ala spreadsheet — tanpa Excel, langsung dari HP, dengan ekspor CSV.

Fitur utama
# 1. Tab Sheet — editor grid interaktif

Grid A1-style (baris × kolom) dengan header kolom lengket, ketuk sel → ketik di kolom fx
Mesin rumus sendiri (recursive-descent parser, sudah diuji unit-test): + − × ÷ ^ %, kurung, referensi sel (=B2*C2), rentang (=SUM(A1:A20))
Fungsi: SUM, AVERAGE, MIN, MAX, COUNT, ROUND, ABS, SQRT, POWER, IF, AND, OR, NOT, CONCAT, plus perbandingan (>=, <>)
Deteksi error spreadsheet asli: #DIV/0!, #REF!, #LOOP! (siklus referensi), #VALUE!, #NAME?
Tambah/kurangi baris & kolom, ubah nama sheet, tombol Simpan ke Arsip
Layar pertama langsung terisi sheet contoh (nota belanja) supaya tidak mulai dari kotak kosong

# 2. Tab Arsip — semua sheet tersimpan lokal (AsyncStorage)

Pencarian, pull-to-refresh, waktu "Hari ini/Kemarin"
Tap untuk buka di editor; tap titik tiga → Buka / Ekspor CSV / Hapus (dengan konfirmasi)

# 3. Ekspor CSV (fokus utama permintaan Anda)

Pilih Nilai (hasil hitungan) atau Rumus (isi sel asli)
Pemisah koma atau titik koma (untuk Excel Indonesia/Eropa), header A,B,C opsional, BOM UTF-8 agar Excel langsung membaca
Pratinjau isi berkas sebelum ekspor, lalu Salin ke clipboard, Bagikan, atau Unduh .csv (web) — penulisan tanda kutip/koma sudah sesuai standar RFC CSV

# 4. Tab Kalkulator — hitung cepat dengan riwayat

Kurung, pangkat, persen; hasil pratinjau otomatis saat mengetik
Setiap hasil "=" tersimpan di riwayat (bisa dipakai ulang/dihapus)

# 5. Tab Bantuan — panduan rumus, format CSV, pengganti tema Terang/Gelap/Auto, reset data.

Kualitas
TypeScript lolos typecheck penuh, ekspor --platform all (web/iOS/Android) tanpa error
Formula engine & generator CSV diverifikasi lewat test runtime (AVERAGE, COUNT, IF berteks, escaping CSV — semuanya benar)
Desain teal-emas profesional dengan dukungan dark mode, animasi Reanimated, SafeArea, FlatList + pull-to-refresh, dan toast feedback di seluruh alur

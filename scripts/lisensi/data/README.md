# Data untuk penerbit lisensi

| File | Isi | Sumber |
|---|---|---|
| `puskesmas.csv` | 10.292 Puskesmas di 514 kab/kota, beserta kode lisensinya (`<kode kab/kota>-<nomor>`) | Komdat Kemenkes RI lewat [ubunteroz/satu-data](https://github.com/ubunteroz/satu-data). Jumlahnya sama dengan data resmi Kemenkes tahun **2021** |
| `kab_kota.csv` | 514 kab/kota dan 38 provinsi | Kepmendagri No. 300.2.2-2430 Tahun 2025 lewat [cahyadsn/wilayah](https://github.com/cahyadsn/wilayah) |
| `puskesmas_tambahan.csv` | Opsional. Puskesmas yang belum ada di daftar | Diisi tim |
| `buat_data.py` | Skrip pembangun `puskesmas.csv` dan `kab_kota.csv` | |

Catatan:

- Data Puskesmas memakai kode kab/kota Papua sebelum pemekaran 2022. Kode itu sudah dipindahkan ke provinsi baru (Papua Selatan, Papua Tengah, Papua Pegunungan, Papua Barat Daya) lewat kecocokan nama kab/kota.
- Nomor urut di kode lisensi dibagikan sekali (urut kode Komdat di tiap kab/kota) lalu **dibekukan** di `puskesmas.csv`. Jangan mengurutkan ulang file ini; kode lisensi yang sudah terbit bergantung padanya.
- Puskesmas yang dibuka setelah 2021, atau yang namanya sudah berubah, mungkin belum ada atau masih memakai nama lama.

## Menambah Puskesmas yang belum ada

Buat `puskesmas_tambahan.csv` di folder ini:

```csv
kode_wilayah,nomor,nama
1171,901,Puskesmas Contoh Baru
```

- `kode_wilayah`: 4 angka kab/kota (lihat `kab_kota.csv`)
- `nomor`: pakai 901 ke atas supaya tidak bentrok dengan nomor di `puskesmas.csv`
- Buka ulang penerbit lisensi; Puskesmas itu muncul dengan tanda `[tambahan]`

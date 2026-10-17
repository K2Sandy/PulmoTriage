"""Pemetaan provinsi ke bidang peta (kode ISO 3166-2) dan ke kelompok pulau.

Peta portal memakai Natural Earth (domain publik) yang berisi 33 provinsi.
Provinsi baru hasil pemekaran digambar di wilayah provinsi induknya:
Kalimantan Utara -> Kalimantan Timur; Papua Selatan/Tengah/Pegunungan -> Papua;
Papua Barat Daya -> Papua Barat.
"""

import re

# nama provinsi (huruf kecil, tanpa spasi/tanda baca) -> (kode ISO di peta, nama tampilan)
_NAMA = {
    "aceh": ("ID-AC", "Aceh"),
    "nanggroeacehdarussalam": ("ID-AC", "Aceh"),
    "sumaterautara": ("ID-SU", "Sumatera Utara"),
    "sumaterabarat": ("ID-SB", "Sumatera Barat"),
    "riau": ("ID-RI", "Riau"),
    "jambi": ("ID-JA", "Jambi"),
    "sumateraselatan": ("ID-SS", "Sumatera Selatan"),
    "bengkulu": ("ID-BE", "Bengkulu"),
    "lampung": ("ID-LA", "Lampung"),
    "kepulauanbangkabelitung": ("ID-BB", "Kepulauan Bangka Belitung"),
    "bangkabelitung": ("ID-BB", "Kepulauan Bangka Belitung"),
    "kepulauanriau": ("ID-KR", "Kepulauan Riau"),
    "dkijakarta": ("ID-JK", "DKI Jakarta"),
    "jakarta": ("ID-JK", "DKI Jakarta"),
    "jakartaraya": ("ID-JK", "DKI Jakarta"),
    "dkjakarta": ("ID-JK", "DKI Jakarta"),
    "jawabarat": ("ID-JB", "Jawa Barat"),
    "jawatengah": ("ID-JT", "Jawa Tengah"),
    "diyogyakarta": ("ID-YO", "DI Yogyakarta"),
    "daerahistimewayogyakarta": ("ID-YO", "DI Yogyakarta"),
    "yogyakarta": ("ID-YO", "DI Yogyakarta"),
    "jawatimur": ("ID-JI", "Jawa Timur"),
    "banten": ("ID-BT", "Banten"),
    "bali": ("ID-BA", "Bali"),
    "nusatenggarabarat": ("ID-NB", "Nusa Tenggara Barat"),
    "ntb": ("ID-NB", "Nusa Tenggara Barat"),
    "nusatenggaratimur": ("ID-NT", "Nusa Tenggara Timur"),
    "ntt": ("ID-NT", "Nusa Tenggara Timur"),
    "kalimantanbarat": ("ID-KB", "Kalimantan Barat"),
    "kalimantantengah": ("ID-KT", "Kalimantan Tengah"),
    "kalimantanselatan": ("ID-KS", "Kalimantan Selatan"),
    "kalimantantimur": ("ID-KI", "Kalimantan Timur"),
    "kalimantanutara": ("ID-KI", "Kalimantan Utara"),
    "sulawesiutara": ("ID-SA", "Sulawesi Utara"),
    "sulawesitengah": ("ID-ST", "Sulawesi Tengah"),
    "sulawesiselatan": ("ID-SN", "Sulawesi Selatan"),
    "sulawesitenggara": ("ID-SG", "Sulawesi Tenggara"),
    "gorontalo": ("ID-GO", "Gorontalo"),
    "sulawesibarat": ("ID-SR", "Sulawesi Barat"),
    "maluku": ("ID-MA", "Maluku"),
    "malukuutara": ("ID-MU", "Maluku Utara"),
    "papua": ("ID-PA", "Papua"),
    "papuabarat": ("ID-PB", "Papua Barat"),
    "papuaselatan": ("ID-PA", "Papua Selatan"),
    "papuatengah": ("ID-PA", "Papua Tengah"),
    "papuapegunungan": ("ID-PA", "Papua Pegunungan"),
    "papuabaratdaya": ("ID-PB", "Papua Barat Daya"),
}

# Kode provinsi Kemendagri (2 angka pertama kode wilayah) -> kode ISO di peta. Dipakai bila nama tidak dikenali.
_KODE = {
    "11": "ID-AC", "12": "ID-SU", "13": "ID-SB", "14": "ID-RI", "15": "ID-JA", "16": "ID-SS",
    "17": "ID-BE", "18": "ID-LA", "19": "ID-BB", "21": "ID-KR", "31": "ID-JK", "32": "ID-JB",
    "33": "ID-JT", "34": "ID-YO", "35": "ID-JI", "36": "ID-BT", "51": "ID-BA", "52": "ID-NB",
    "53": "ID-NT", "61": "ID-KB", "62": "ID-KT", "63": "ID-KS", "64": "ID-KI", "65": "ID-KI",
    "71": "ID-SA", "72": "ID-ST", "73": "ID-SN", "74": "ID-SG", "75": "ID-GO", "76": "ID-SR",
    "81": "ID-MA", "82": "ID-MU", "91": "ID-PA", "92": "ID-PB", "93": "ID-PA", "94": "ID-PA",
    "95": "ID-PA", "96": "ID-PB",
}
_NAMA_ISO = {
    "ID-AC": "Aceh", "ID-SU": "Sumatera Utara", "ID-SB": "Sumatera Barat", "ID-RI": "Riau",
    "ID-JA": "Jambi", "ID-SS": "Sumatera Selatan", "ID-BE": "Bengkulu", "ID-LA": "Lampung",
    "ID-BB": "Kepulauan Bangka Belitung", "ID-KR": "Kepulauan Riau", "ID-JK": "DKI Jakarta",
    "ID-JB": "Jawa Barat", "ID-JT": "Jawa Tengah", "ID-YO": "DI Yogyakarta", "ID-JI": "Jawa Timur",
    "ID-BT": "Banten", "ID-BA": "Bali", "ID-NB": "Nusa Tenggara Barat", "ID-NT": "Nusa Tenggara Timur",
    "ID-KB": "Kalimantan Barat", "ID-KT": "Kalimantan Tengah", "ID-KS": "Kalimantan Selatan",
    "ID-KI": "Kalimantan Timur", "ID-SA": "Sulawesi Utara", "ID-ST": "Sulawesi Tengah",
    "ID-SN": "Sulawesi Selatan", "ID-SG": "Sulawesi Tenggara", "ID-GO": "Gorontalo",
    "ID-SR": "Sulawesi Barat", "ID-MA": "Maluku", "ID-MU": "Maluku Utara", "ID-PA": "Papua",
    "ID-PB": "Papua Barat",
}


def bidang_peta(provinsi: str | None, kode_wilayah: str | None) -> str | None:
    """Kode ISO bidang peta untuk sebuah Puskesmas, atau None bila tidak bisa ditentukan."""
    kunci = re.sub(r"[^a-z]", "", (provinsi or "").lower())
    if kunci.startswith("provinsi"):
        kunci = kunci[len("provinsi"):]
    if kunci in _NAMA:
        return _NAMA[kunci][0]
    if kode_wilayah and kode_wilayah[:2] in _KODE:
        return _KODE[kode_wilayah[:2]]
    return None


def nama_bidang(iso: str) -> str:
    return _NAMA_ISO.get(iso, iso)

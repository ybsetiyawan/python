from fastapi import FastAPI, UploadFile, File
from typing import List, Dict, Any, Optional
from paddleocr import PaddleOCR
from PIL import Image, ImageEnhance
import shutil
import os
import re
import json
import csv
from datetime import datetime

app = FastAPI()

# ==================== KONFIGURASI OCR ====================
ocr = PaddleOCR(
    use_angle_cls=True,
    lang="id",          
    drop_score=0.1,
    det_db_thresh=0.15,
    det_db_box_thresh=0.15,
    show_log=False
)

# ==================== KONSTANTA ====================
VALID_PROVINSI = {
    "11", "12", "13", "14", "15", "16", "17", "18", "19", "21", 
    "31", "32", "33", "34", "35", "36", "51", "52", "53", "61", 
    "62", "63", "64", "65", "71", "72", "73", "74", "75", "76", 
    "81", "82", "91", "92"
}

VALID_PROVINCE_CODES = {
    "11", "12", "13", "14", "15", "16", "17", "18", "19", "21", 
    "31", "32", "33", "34", "35", "36", "51", "52", "53", "61", 
    "62", "63", "64", "65", "71", "72", "73", "74", "75", "76", 
    "81", "82", "91", "92"
}

VALID_DISTRICT_CODES = set()

BLACKLIST_NAMA = {
    "KONFIRMASI", "DATA", "VERIFIKASI", "IDENTITAS", "ITEM", "DRAFT",
    "LEBIH", "100%", "0°", "BACK", "NEXT", "SELANJUTNYA",
    "NAMA", "NIK", "PROVINSI", "KABUPATEN", "KOTA", "ALAMAT",
    "RT", "RW", "KELAMIN", "AGAMA", "STATUS", "PEKERJAAN",
    "KEWARGANEGARAAN", "BERLAKU", "HINGGA", "TEMPAT", "LAHIR",
    "GOLONGAN", "DARAH", "KECAMATAN", "KELURAHAN", "DESA",
    "MENGURUSRUMAHTANGGA", "MENGURUS", "RUMAH", "TANGGA",
    "BELUM/TIDAKBEKERJA", "BELUM", "TIDAK", "BEKERJA",
    "PELAJAR", "MAHASISWA", "PNS", "TNI", "POLRI",
    "SWASTA", "WIRASWASTA", "PETANI", "NELAYAN",
    "BURUH", "KARYAWAN", "PEGAWAI",
    "PEREMPUAN", "LAKI-LAKI", "ISLAM", "KAWIN", "BELUM KAWIN",
    "WNI", "SEUMUR", "HIDUP", "SUAMI", "ISTRI", "ANAK", "ORANG TUA",
    "NOMOR", "TANGGAL", "BULAN", "TAHUN",
    "TERIMA", "AUAL", "INAT", "MNA", "HIGA", "MHAH",
    "SEISLAM", "EPEREMPUAN", "DMNAA", "HAMA", "COTL", "COT",
    "IOOAN", "IASI", "INM", "ESEAEA", "IOOON", "TASI",
    "ORAAC", "RIRRN", "JUAL", "KEBIH", "NNA", "LANAA",
    "ALANAT", "TAMA", "Pekerjaan", "Agama", "PETLAIEN",
    "KARANGPENANGOLOH", "AIAMAT", "AANBA", "TRELAAED", "RIRAN",
    "BELUMTIDAKBEKERJA", "SEUMURHIDUP", "LAKILAKL",
    "STALUS PERKAWINAN", "GUNUNG MADDAH", "JL.H ABDULLAH",
    "CERAI MATI", "NINA", "BERLAKU HINGGA", "KARA", "TORJUN",
    "JENIS KELARMIN", "JENIS KELAMIN", "JENISKELAMIN", "NAME",
    "CAIDR", "ROY", "KLOMPANCTIMUF", "KECAMAIAN", "AGAMO",
    "PAMLKASAN", "OLANAAN", "PAMEKA8AN.17--1995", "CALLATHR",
    "IDERE", "NAN", "AAN", "AOD", "DING", "NG",
    "TANUPEKEBUN", "DUSUN GIFING BARAT", "SUMEN", "EP7-0210",
    "INFO", "GOLDARAH:", "XL", "RTRW", "PY1SI", "ANT", "SUMENE",
    "EGAPURABARAT", "GAPURA", "NAEN",
    "DUSUNPAJAGALAN", "PAJAGALAN", "DUSUN",
    "SOESWEP", "RAY", "PAKAJUAN", "ISSSS", "ARAAT", "KCEOCEY",
    "JRUBIN SAIO", "EEEEED", "CURNOY", "WWET", "LPWETY",
    "MAAAANA", "E0000TT256T625E",
    "T000ER2T6hE062SE", "IMAA", "A4AAA", "INMA", "NANA",
    "23IUP", "FE", "ISLAME", "HED", "ATANAL", "AMMMA",
    "PROVINSI JAWATIMUR", "PROVINSIJAWATIMUR",
    "MAMA", "MAMAH", "MAMAK", "BAPAK", "IBU", "SAUDARA"
}

LOCATION_NAMES = {
    "GUNUNG MADDAH", "GUNUNGMADDAH", "KARANGPENANG", "KARANGPENANGOLOE",
    "KLOMPANGTIMUR", "KLOMPANG", "PAKONG", "RAGUNUNG", "DSNRAGUNUNG",
    "SAMPANG", "PAMEKASAN", "MADURA", "JATIM", "JAWA TIMUR",
    "KARANGPENANGOLOH", "KARANGPENANG OLOH", "TORJUN", "KARA",
    "BUJEL", "NGIMBANG", "SENDANGREJO", "LAMONGAN",
    "DUSUN GIFING BARAT", "TANUPEKEBUN", "EGAPURABARAT", "GAPURA",
    "DUSUNPAJAGALAN", "PAJAGALAN"
}

MADURA_DISTRICTS = {
    "SAMPANG": "3527",
    "PAMEKASAN": "3528", 
    "SUMENEP": "3529",
    "BANGKALAN": "3526"
}

# ==================== LOAD KODE WILAYAH ====================
class KodeWilayahLoader:
    def __init__(self, csv_path: str = "kode_wilayah.csv"):
        self.csv_path = csv_path
        self.kode_map = {}
        self.province_map = {}
        self.district_map = {}
        self.subdistrict_map = {}
        self._load_data()
    
    def _load_data(self):
        if not os.path.exists(self.csv_path):
            self._load_madura_data()
            return
        
        try:
            with open(self.csv_path, 'r', encoding='utf-8') as f:
                reader = csv.reader(f)
                first_row = next(reader, None)
                if first_row and first_row[0] == "code":
                    pass
                elif first_row:
                    self._process_row(first_row)
                
                for row in reader:
                    if len(row) >= 4:
                        self._process_row(row)
            
            for code in self.kode_map.keys():
                VALID_DISTRICT_CODES.add(code)
                
        except Exception as e:
            self._load_madura_data()
    
    def _process_row(self, row):
        try:
            code = row[0].strip()
            province = row[1].strip().upper()
            district = row[2].strip().upper()
            subdistrict = row[3].strip().upper()
            
            code_4digit = code[:4]
            
            if code_4digit not in self.kode_map:
                self.kode_map[code_4digit] = {
                    "code": code_4digit,
                    "province": province,
                    "district": district,
                    "subdistricts": []
                }
            
            if subdistrict and subdistrict not in self.kode_map[code_4digit]["subdistricts"]:
                self.kode_map[code_4digit]["subdistricts"].append(subdistrict)
            
            if province and province not in self.province_map:
                self.province_map[province] = code_4digit
            
            if district and district not in self.district_map:
                self.district_map[district] = code_4digit
            
            if subdistrict and subdistrict not in self.subdistrict_map:
                self.subdistrict_map[subdistrict] = code_4digit
        except:
            pass
    
    def _load_madura_data(self):
        self.kode_map = {
            "3527": {"code": "3527", "province": "JAWA TIMUR", "district": "KABUPATEN SAMPANG", "subdistricts": []},
            "3528": {"code": "3528", "province": "JAWA TIMUR", "district": "KABUPATEN PAMEKASAN", "subdistricts": []},
            "3529": {"code": "3529", "province": "JAWA TIMUR", "district": "KABUPATEN SUMENEP", "subdistricts": []},
            "3526": {"code": "3526", "province": "JAWA TIMUR", "district": "KABUPATEN BANGKALAN", "subdistricts": []},
        }
        for code, info in self.kode_map.items():
            self.district_map[info["district"]] = code
            VALID_DISTRICT_CODES.add(code)
    
    def get_kode_by_location(self, text: str) -> Optional[str]:
        if not text:
            return None
        
        text_upper = text.upper().strip()
        
        for name, code in MADURA_DISTRICTS.items():
            if name in text_upper:
                return code
        
        for name, code in self.subdistrict_map.items():
            if name in text_upper:
                return code
        
        for name, code in self.district_map.items():
            if name in text_upper:
                return code
        
        for name, code in self.province_map.items():
            if name in text_upper:
                return code
        
        return None
    
    def is_valid_nik_7digit(self, nik_7digit: str) -> bool:
        if not nik_7digit or len(nik_7digit) != 7:
            return False
        
        province_code = nik_7digit[:2]
        district_code = nik_7digit[:4]
        
        if province_code not in VALID_PROVINCE_CODES:
            return False
        
        if district_code not in self.kode_map:
            return False
        
        return True
    
    def get_location_from_text(self, text: str) -> Optional[str]:
        if not text:
            return None
        
        text_upper = text.upper()
        
        for name in MADURA_DISTRICTS.keys():
            if name in text_upper:
                return name
        
        for name in self.district_map.keys():
            if name in text_upper:
                return name
        
        return None

kode_loader = KodeWilayahLoader("kode_wilayah.csv")

# ==================== FUNGSI UTILITY ====================
def fix_ocr_number_typos(text: str) -> str:
    replacements = {
        'I': '1', 'L': '1', 'l': '1', '|': '1', '[': '1', ']': '1', 'i': '1',
        'O': '0', 'D': '0', 'o': '0', 'Q': '0',
        'B': '8', 'b': '8',
        'S': '5', 's': '5',
        'G': '6', 'g': '6',
        'T': '7', 't': '7',
        'A': '4'
    }
    chars = list(text)
    for i, char in enumerate(chars):
        if char in replacements:
            chars[i] = replacements[char]
    return "".join(chars)

def enhance_image(image_path):
    try:
        img = Image.open(image_path)
        if img.mode != 'RGB':
            img = img.convert('RGB')
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(1.8)
        enhancer = ImageEnhance.Sharpness(img)
        img = enhancer.enhance(1.5)
        enhancer = ImageEnhance.Brightness(img)
        img = enhancer.enhance(1.2)
        enhanced_path = f"enhanced_{os.path.basename(image_path)}"
        img.save(enhanced_path, quality=95)
        return enhanced_path
    except Exception:
        return image_path

def extract_birth_date_improved(text: str, location_name: str = None) -> Optional[str]:
    if not text:
        return None
    
    text_upper = text.upper()
    
    if location_name:
        location_upper = location_name.upper()
        location_date_pattern = rf'{location_upper}\s*[,.;:]?\s*([\d\-/.]+)'
        match = re.search(location_date_pattern, text_upper)
        if match:
            date_text = match.group(1)
            patterns = [
                r'(\d{2})[-/.](\d{2})[-/.](\d{4})',
                r'(\d{2})[-/.](\d{2})[-/.](\d{2})',
                r'(\d{2})(\d{2})(\d{4})',
                r'(\d{2})(\d{2})(\d{2})',
            ]
            
            for pattern in patterns:
                match_date = re.search(pattern, date_text)
                if match_date:
                    day = match_date.group(1)
                    month = match_date.group(2)
                    year = match_date.group(3)
                    
                    if len(year) == 4:
                        year = year[2:4]
                    
                    try:
                        d = int(day)
                        m = int(month)
                        y = int(year)
                        if 1 <= d <= 31 and 1 <= m <= 12 and 0 <= y <= 99:
                            return f"{day}{month}{year}"
                    except:
                        pass
    
    patterns = [
        r'\b(\d{2})[-/.](\d{2})[-/.](\d{4})\b',
        r'\b(\d{2})[-/.](\d{2})[-/.](\d{2})\b',
        r'\b(\d{2})(\d{2})(\d{4})\b',
        r'\b(\d{2})(\d{2})(\d{2})\b',
        r'LAHIR\s*[:;]?\s*[\w\s]*?(\d{2})[-/.](\d{2})[-/.](\d{4})',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text_upper)
        if match:
            day = match.group(1)
            month = match.group(2)
            year = match.group(3)
            
            if len(year) == 4:
                year = year[2:4]
            
            try:
                d = int(day)
                m = int(month)
                y = int(year)
                if 1 <= d <= 31 and 1 <= m <= 12 and 0 <= y <= 99:
                    return f"{day}{month}{year}"
            except:
                pass
    
    six_digit_patterns = [
        r'\b(\d{6})\b',
        r'[,.]\s*(\d{6})',
    ]
    
    for pattern in six_digit_patterns:
        match = re.search(pattern, text_upper)
        if match:
            potential_date = match.group(1)
            if len(potential_date) == 6:
                day = potential_date[:2]
                month = potential_date[2:4]
                year = potential_date[4:6]
                try:
                    d = int(day)
                    m = int(month)
                    y = int(year)
                    if 1 <= d <= 31 and 1 <= m <= 12 and 0 <= y <= 99:
                        return potential_date
                except:
                    pass
    
    return None

def generate_nik_complete(kode_4digit: str, birth_date_6digit: Optional[str] = None) -> Optional[str]:
    if not kode_4digit or len(kode_4digit) != 4:
        return None
    
    if kode_4digit not in kode_loader.kode_map:
        return None
    
    kk = kode_4digit[:2]
    kab = kode_4digit[2:4]
    kec = "00"
    
    if birth_date_6digit and len(birth_date_6digit) == 6:
        nik = f"{kk}{kab}{kec}{birth_date_6digit}0000"
        if len(nik) == 16 and nik[:2] in VALID_PROVINSI:
            return nik
    
    nik = f"{kk}{kab}{kec}0101000001"
    if len(nik) == 16 and nik[:2] in VALID_PROVINSI:
        return nik
    
    return None

def is_valid_name(text: str, check_location=True) -> bool:
    text_upper = text.upper().strip()
    
    if len(text_upper) < 3:
        return False
    
    sapaan = ["MAMA", "MAMAH", "MAMAK", "BAPAK", "IBU", "SAUDARA", "MAS", "MBAK", "KAK"]
    if text_upper in sapaan:
        return False
    
    clean_text = text_upper
    if clean_text.startswith('-') or clean_text.endswith('-'):
        clean_text = clean_text.strip('-')
        if len(clean_text) < 3:
            return False
    
    if clean_text.startswith('.') or clean_text.endswith('.'):
        clean_text = clean_text.strip('.')
        if len(clean_text) < 3:
            return False
    
    location_indicators = ["DUSUN", "DSN", "DESA", "KEL", "KEC", "RT", "RW", "DS"]
    for indicator in location_indicators:
        if indicator in clean_text:
            return False
    
    if len(clean_text) == 3:
        vowels = ['A', 'I', 'U', 'E', 'O']
        if clean_text[1] not in vowels:
            return False
        if clean_text[0] not in vowels and clean_text[2] not in vowels:
            return False
    
    if re.search(r'\d', clean_text):
        return False
    
    vowels = ['A', 'I', 'U', 'E', 'O']
    vowel_count = sum(1 for char in clean_text if char in vowels)
    if vowel_count < 2 and len(clean_text) > 3:
        return False
    
    if re.search(r'[^A-Z\s\'\-]', clean_text):
        return False
    
    if clean_text in BLACKLIST_NAMA:
        return False
    
    for bad_word in BLACKLIST_NAMA:
        if bad_word in clean_text:
            return False
    
    occupation_patterns = [
        "MENGURUS", "RUMAH", "TANGGA", "BEKERJA", "BELUM", "TIDAK",
        "PELAJAR", "MAHASISWA", "PNS", "TNI", "POLRI",
        "SWASTA", "WIRASWASTA", "PETANI", "NELAYAN",
        "BURUH", "KARYAWAN", "PEGAWAI", "CERAI", "MATI",
        "SEUMUR", "HIDUP", "KAWIN"
    ]
    for pattern in occupation_patterns:
        if pattern in clean_text:
            return False
    
    if check_location and clean_text in LOCATION_NAMES:
        return False
    
    location_patterns = ["PROVINSI", "KABUPATEN", "KOTA", "KECAMATAN", "KELURAHAN", "DESA", "DSN"]
    for pattern in location_patterns:
        if pattern in clean_text:
            return False
    
    return True

def run_best_ocr(image_path):
    try:
        enhanced_path = enhance_image(image_path)
        img = Image.open(enhanced_path)
        
        best_result = None
        best_count = 0

        for angle in [0, 90, 180, 270]:
            if angle == 0:
                rotated = img
            else:
                rotated = img.rotate(angle, expand=True)
            
            temp_rotate = f"rotate_{angle}_{os.path.basename(image_path)}"
            rotated.save(temp_rotate)
            result = ocr.ocr(temp_rotate, cls=True)
            
            if os.path.exists(temp_rotate):
                os.remove(temp_rotate)
            
            count = len(result[0]) if result and result[0] else 0
            
            if count > best_count:
                best_count = count
                best_result = result
        
        if enhanced_path != image_path and os.path.exists(enhanced_path):
            os.remove(enhanced_path)
        
        return best_result
    except Exception:
        return None

def extract_name_improved(ocr_lines: List[Dict]) -> str:
    filtered_lines = []
    for item in ocr_lines:
        text = item["text"].strip()
        text_upper = text.upper()
        
        if len(text) < 2:
            continue
        
        ui_elements = [
            "KONFIRMASI", "VERIFIKASI", "IDENTITAS", "ITEM", "LEBIH", "DRAFT",
            "TERIMA", "AUAL", "MNA", "INAT", "HIGA", "MHAH",
            "SEISLAM", "EPEREMPUAN", "DMNAA", "HAMA", "COTL", "COT",
            "IOOAN", "IASI", "INM", "ESEAEA", "IOOON", "TASI",
            "ORAAC", "RIRRN", "JUAL", "KEBIH", "NNA", "LANAA",
            "ALANAT", "TAMA", "PETLAIEN", "KARANGPENANGOLOH",
            "AIAMAT", "AANBA", "TRELAAED", "RIRAN", 
            "BELUMTIDAKBEKERJA", "SEUMURHIDUP", "LAKILAKL",
            "STALUS PERKAWINAN", "GUNUNG MADDAH", "JL.H ABDULLAH",
            "CERAI MATI", "BERLAKU HINGGA", "SEUMUR HIDUPE",
            "MENGURUS RUMAH TANGGA", "GOF.DARAH0", "GOL.DARAH",
            "CAIDR", "ROY", "KLOMPANCTIMUF", "KECAMAIAN", "AGAMO",
            "PAMLKASAN", "OLANAAN", "PAMEKA8AN.17--1995",
            "BUJEL", "NGIMBANG", "SENDANGREJO", "LAMONGAN",
            "KABUPATEN LAMONGAN", "PROVINSIJAWA TIMUR",
            "CALLATHR", "IDERE", "NAN", "AAN", "AOD", "DING", "NG",
            "TANUPEKEBUN", "DUSUN GIFING BARAT", "SUMEN", "EP7-0210",
            "INFO", "GOLDARAH:", "XL", "RTRW", "PY1SI", "ANT", "SUMENE",
            "EGAPURABARAT", "GAPURA", "NAEN",
            "DUSUNPAJAGALAN", "PAJAGALAN", "DUSUN",
            "SOESWEP", "RAY", "PAKAJUAN", "ISSSS", "ARAAT", "KCEOCEY",
            "JRUBIN SAIO", "EEEEED", "CURNOY", "WWET", "LPWETY",
            "MAAAANA", "E0000TT256T625E",
            "T000ER2T6hE062SE", "IMAA", "A4AAA", "INMA", "NANA",
            "23IUP", "FE", "ISLAME", "HED", "ATANAL", "AMMMA",
            "PROVINSI JAWATIMUR", "PROVINSIJAWATIMUR",
            "MAMA", "MAMAH", "MAMAK", "BAPAK", "IBU", "SAUDARA",
            "KABUPATEN SUMENEP", "TEMPAT/TGLLAHIR", "JENIS KELAMIN",
            "BERTAK HIRGGA", "STALUS PERKAWINARR.KAWIN"
        ]
        if any(ui in text_upper for ui in ui_elements):
            continue
        
        if re.match(r'^[\d\W]+$', text):
            continue
        if '/' in text or '%' in text or '°' in text:
            continue
        if text_upper in ["WNI", "ISLAM", "PEREMPUAN", "KAWIN", "NAME"]:
            continue
        
        filtered_lines.append(item)
    
    if not filtered_lines:
        return "Tidak Terdeteksi"
    
    nama_anchor = None
    for item in filtered_lines:
        text_upper = item["text"].upper().strip()
        if text_upper in ["NAMA", "NAMA LENGKAP", "HAMA", "TAMA", "NAME"]:
            nama_anchor = item
            break
    
    if nama_anchor:
        anchor_y = nama_anchor["y"]
        anchor_x = nama_anchor["x"]
        
        if ":" in nama_anchor["text"] or ";" in nama_anchor["text"]:
            parts = re.split(r'[:;]', nama_anchor["text"], 1)
            if len(parts) > 1:
                candidate = parts[1].strip()
                candidate = re.sub(r'^[\'"]+|[\'"]+$', '', candidate)
                if is_valid_name(candidate):
                    return candidate.upper()
        
        right_candidates = []
        for item in filtered_lines:
            if item == nama_anchor:
                continue
            text = item["text"].strip()
            if abs(item["y"] - anchor_y) < 35 and item["x"] > anchor_x + 5:
                if is_valid_name(text):
                    right_candidates.append((item["x"] - anchor_x, text))
        
        if right_candidates:
            right_candidates.sort(key=lambda x: x[0])
            for _, text in right_candidates[:3]:
                if text.upper() not in ["PEKERJAAN", "ALAMAT", "AGAMA", "NIK"]:
                    return text.upper()
        
        below_candidates = []
        for item in filtered_lines:
            if item == nama_anchor:
                continue
            text = item["text"].strip()
            if 0 < (item["y"] - anchor_y) < 200 and abs(item["x"] - anchor_x) < 300:
                if is_valid_name(text):
                    if text.upper() not in ["PEKERJAAN", "ALAMAT", "AGAMA", "NIK"]:
                        below_candidates.append((item["y"] - anchor_y, text))
        
        if below_candidates:
            below_candidates.sort(key=lambda x: x[0])
            return below_candidates[0][1].upper()
    
    name_candidates = []
    label_patterns = ["PROVINSI", "KABUPATEN", "NIK", "ALAMAT", "RT", "RW", 
                     "KEL", "KEC", "AGAMA", "STATUS", "PEKERJAAN", 
                     "KEWARGANEGARAAN", "BERLAKU", "TEMPAT", "LAHIR",
                     "GOL", "DARAH", "JENIS", "KELAMIN", "RTRW"]
    
    y_positions = [item["y"] for item in filtered_lines]
    if y_positions:
        y_min = min(y_positions)
        y_max = max(y_positions)
        y_range = y_max - y_min if y_max > y_min else 1
    else:
        y_range = 1
    
    for item in filtered_lines:
        text = item["text"].strip()
        text_upper = text.upper()
        
        is_label = False
        for pattern in label_patterns:
            if pattern in text_upper:
                is_label = True
                break
        if is_label:
            continue
        
        if text_upper in LOCATION_NAMES:
            continue
        
        if is_valid_name(text, check_location=True):
            score = 0
            
            if ' ' in text:
                score += 30
            
            if 5 <= len(text) <= 20:
                score += 40
            elif len(text) > 20:
                score += 15
            else:
                score += 20
            
            if len(text) <= 3:
                score -= 30
            
            if '-' in text or '_' in text or '.' in text:
                score -= 15
            
            name_endings = ['A', 'I', 'U', 'E', 'O', 'H', 'N', 'AH', 'AN', 'I']
            if text_upper[-1] in name_endings or text_upper[-2:] in name_endings:
                score += 15
            
            vowels = ['A', 'I', 'U', 'E', 'O']
            vowel_count = sum(1 for char in text_upper if char in vowels)
            if vowel_count >= 3:
                score += 10
            elif vowel_count >= 2:
                score += 5
            
            if vowel_count < 2 and len(text) > 3:
                score -= 15
            
            if not text.isupper():
                score += 20
            
            normalized_y = (item["y"] - y_min) / y_range if y_range > 0 else 0.5
            if 0.2 < normalized_y < 0.6:
                score += 25
            elif normalized_y < 0.2:
                score += 15
            
            if not re.search(r'[\d\W]', text):
                score += 10
            
            if text[0].isupper():
                score += 5
            
            if nama_anchor:
                distance = abs(item["y"] - nama_anchor["y"])
                if distance < 100:
                    score += 50
                elif distance < 200:
                    score += 30
                elif distance < 300:
                    score += 15
            
            name_candidates.append((score, text, item["y"]))
    
    if name_candidates:
        name_candidates.sort(key=lambda x: (-x[0], x[2]))
        top_score = name_candidates[0][0]
        if top_score > 30:
            return name_candidates[0][1].upper()
    
    return "Tidak Terdeteksi"

def extract_ktp_data(result) -> Dict[str, Any]:
    if not result or not result[0]:
        return {"nik": "Tidak Terdeteksi", "nama": "Tidak Terdeteksi"}

    ocr_lines = []
    texts_only = []

    for line in result[0]:
        box = line[0]
        text = line[1][0].strip()
        score = line[1][1]

        if score >= 0.1:
            texts_only.append(text)
            
            x_center = (box[0][0] + box[1][0] + box[2][0] + box[3][0]) / 4
            y_center = (box[0][1] + box[1][1] + box[2][1] + box[3][1]) / 4
            
            ocr_lines.append({
                "text": text,
                "x": x_center,
                "y": y_center,
                "box": box
            })

    all_text = "\n".join(texts_only).upper()

    ui_patterns = ["KONFIRMASI", "VERIFIKASI", "IDENTITAS", "ITEM", "LEBIH", "DRAFT", "100%", "0°"]
    for pattern in ui_patterns:
        all_text = all_text.replace(pattern.upper(), "")

    # PERUBAHAN: Lebih longgar dalam mendeteksi KTP
    ktp_keywords = ["PROVINSI", "KABUPATEN", "KOTA", "NIK", "ALAMAT", "LAHIR"]
    matches = sum(1 for keyword in ktp_keywords if keyword in all_text)
    
    # PERUBAHAN: Turunkan threshold dari 1 ke 0 (lebih longgar)
    if matches < 0:
        return {"nik": "Bukan Dokumen KTP", "nama": "Bukan Dokumen KTP"}

    data = {
        "nik": "Tidak Terdeteksi", 
        "nama": "Tidak Terdeteksi"
    }

    # ===================== EXTRACT NIK - DIPERBAIKI =====================
    nik_found = False
    backup_nik = None
    
    # STRATEGI 1: Cari NIK 16 digit dengan validasi provinsi
    for item in ocr_lines:
        cleaned = re.sub(r"[:\s\-=._]", "", item["text"])
        fixed = fix_ocr_number_typos(cleaned)
        numbers_only = re.sub(r"\D", "", fixed)
        
        # Cari semua kemungkinan 16 digit
        for i in range(len(numbers_only) - 15):
            potential_nik = numbers_only[i:i+16]
            # Validasi provinsi
            if potential_nik[:2] in VALID_PROVINSI:
                data["nik"] = potential_nik
                nik_found = True
                break
            # Simpan sebagai backup walau provinsi tidak valid
            elif backup_nik is None:
                backup_nik = potential_nik
        
        if nik_found:
            break
    
    # STRATEGI 2: Jika tidak ketemu, gunakan backup NIK (walau provinsi tidak valid)
    if not nik_found and backup_nik:
        data["nik"] = backup_nik
        nik_found = True
    
    # STRATEGI 3: Generate dari lokasi dan tanggal lahir
    if not nik_found:
        location_name = kode_loader.get_location_from_text(all_text)
        location_code = None
        
        if location_name:
            location_code = kode_loader.get_kode_by_location(location_name)
            
            if location_code:
                birth_date = extract_birth_date_improved(all_text, location_name)
                nik = generate_nik_complete(location_code, birth_date)
                if nik:
                    data["nik"] = nik
                    nik_found = True
    
    # STRATEGI 4: Cari NIK yang terpisah dengan spasi atau karakter lain
    if not nik_found:
        # Cari pola NIK yang terpisah (misal: 1234 5678 9012 3456)
        nik_patterns = [
            r'\b(\d{4})\s+(\d{4})\s+(\d{4})\s+(\d{4})\b',
            r'\b(\d{4})[-.](\d{4})[-.](\d{4})[-.](\d{4})\b',
            r'\b(\d{2})\s+(\d{2})\s+(\d{2})\s+(\d{2})\s+(\d{2})\s+(\d{2})\s+(\d{2})\s+(\d{2})\b',
        ]
        
        for pattern in nik_patterns:
            match = re.search(pattern, all_text)
            if match:
                # Gabungkan semua grup
                nik_parts = match.groups()
                potential_nik = ''.join(nik_parts)
                if len(potential_nik) >= 16:
                    # Ambil 16 digit pertama
                    potential_nik = potential_nik[:16]
                    if potential_nik[:2] in VALID_PROVINSI:
                        data["nik"] = potential_nik
                        nik_found = True
                        break
                    elif not data["nik"] or data["nik"] == "Tidak Terdeteksi":
                        data["nik"] = potential_nik
                        nik_found = True
                        break
    
    # STRATEGI 5: Cari angka 15-16 digit di teks
    if not nik_found:
        all_numbers = re.sub(r'\D', '', all_text)
        if len(all_numbers) >= 16:
            # Coba cari 16 digit berturut-turut
            for i in range(len(all_numbers) - 15):
                potential_nik = all_numbers[i:i+16]
                if potential_nik[:2] in VALID_PROVINSI:
                    data["nik"] = potential_nik
                    nik_found = True
                    break
                elif not data["nik"] or data["nik"] == "Tidak Terdeteksi":
                    data["nik"] = potential_nik
                    nik_found = True
                    break

    # EXTRACT NAMA
    data["nama"] = extract_name_improved(ocr_lines)

    # EXTRACT OTHER DATA
    for i, item in enumerate(ocr_lines):
        if "LAHIR" in item["text"].upper():
            value = re.sub(r"(?i).*LAHIR\s*[:;.]?\s*", "", item["text"]).strip()
            if value:
                data["tempat_tgl_lahir"] = value.upper()
            elif i + 1 < len(ocr_lines):
                data["tempat_tgl_lahir"] = ocr_lines[i + 1]["text"].strip().upper()
            break

    if "PEREMPUAN" in all_text:
        data["jenis_kelamin"] = "PEREMPUAN"
    elif "LAKI" in all_text:
        data["jenis_kelamin"] = "LAKI-LAKI"

    rt_match = re.search(r"\d{3}\s*/\s*\d{3}", all_text)
    if rt_match:
        data["rt_rw"] = rt_match.group().replace(" ", "")

    return data

@app.post("/ocr")
async def read_images(files: List[UploadFile] = File(...)):
    if len(files) > 100:
        return {"error": "Maksimal 100 file per hit"}

    results = []
    success = 0
    failed = 0

    for idx, file in enumerate(files):
        try:
            temp_file = f"temp_{file.filename}"
            with open(temp_file, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            result = run_best_ocr(temp_file)

            if os.path.exists(temp_file):
                os.remove(temp_file)

            parsed = extract_ktp_data(result)
            success += 1

            results.append({
                "filename": file.filename,
                "data": parsed
            })

        except Exception as e:
            failed += 1
            results.append({
                "filename": file.filename,
                "error": str(e)
            })

    return {
        "total": len(files),
        "success": success,
        "failed": failed,
        "results": results
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
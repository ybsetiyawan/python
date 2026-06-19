from fastapi import FastAPI, UploadFile, File
from typing import List
from paddleocr import PaddleOCR
from PIL import Image
import shutil
import os
import re

app = FastAPI()

# KEMBALI KE "en" (Bahasa Inggris jauh lebih agresif dan matang dalam membaca angka dibanding "id")
ocr = PaddleOCR(
    use_angle_cls=True,
    lang="en",          
    drop_score=0.15,    # Diturunkan agar teks yang agak buram tidak langsung dibuang
    det_db_thresh=0.2,
    det_db_box_thresh=0.3
)


def fix_ocr_number_typos(text: str) -> str:
    """
    Fungsi krusial: Memperbaiki kesalahan umum PaddleOCR saat membaca angka pada KTP
    yang sering tertukar dengan huruf akibat kilatan lampu atau noise cetakan.
    """
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


def run_best_ocr(image_path):
    """
    Mencoba rotasi 0, 90, 180, 270 derajat.
    Mengambil hasil OCR dengan jumlah teks terbanyak.
    """
    img = Image.open(image_path)
    best_result = None
    best_count = 0

    for angle in [0, 90, 180, 270]:
        if angle == 0:
            rotated = img
        else:
            rotated = img.rotate(angle, expand=True)

        temp_rotate = f"rotate_{angle}_{os.path.basename(image_path)}"
        rotated.save(temp_rotate)
        
        # Tambahkan cls=True untuk memaksimalkan deteksi arah text/sudut
        result = ocr.ocr(temp_rotate, cls=True)
        
        if os.path.exists(temp_rotate):
            os.remove(temp_rotate)

        count = len(result[0]) if result and result[0] else 0

        if count > best_count:
            best_count = count
            best_result = result

    return best_result


def extract_ktp_data(result):
    texts = []

    if not result or not result[0]:
        return {}

    for line in result[0]:
        text = line[1][0].strip()
        score = line[1][1]

        # Kami turunkan sedikit ke 0.25 agar karakter hancur/samar tetap masuk
        if score >= 0.25:
            texts.append(text)

    all_text = "\n".join(texts).upper()
    data = {
        "nik": "Tidak Terdeteksi", 
        "nama": "Tidak Terdeteksi"
    }

    # =======================================================
    # STRATEGI BRUTE-FORCE NIK: POKOKNYA CARI 16 DIGIT ANGKA
    # =======================================================
    nik_found = False
    
    # Langkah 1: Gabungkan teks per baris dan langsung bersihkan dari simbol pembatas
    for text in texts:
        cleaned = re.sub(r"[:\s\-=._]", "", text)
        fixed = fix_ocr_number_typos(cleaned)
        numbers_only = re.sub(r"\D", "", fixed)
        
        # Cari apakah ada potongan 16 angka beruntun di baris ini
        match = re.search(r"\d{16}", numbers_only)
        if match:
            data["nik"] = match.group()
            nik_found = True
            break

    # Langkah 2: Jika per baris tidak ada yang pas 16 digit (misal NIK terpecah jadi beberapa baris/kotak oleh PaddleOCR)
    if not nik_found:
        # Gabungkan seluruh teks di KTP menjadi satu string panjang berisi angka saja
        all_cleaned = re.sub(r"[:\s\-=._]", "", all_text)
        all_fixed = fix_ocr_number_typos(all_cleaned)
        all_numbers = re.sub(r"\D", "", all_fixed)
        
        # Ambil 16 angka pertama yang muncul di seluruh KTP tersebut
        match_global = re.search(r"\d{16}", all_numbers)
        if match_global:
            data["nik"] = match_global.group()
            nik_found = True

    # Langkah 3: Jika masih tidak ketemu 16 digit, cari yang paling mendekati (15 atau 17 digit)
    if not nik_found:
        for text in texts:
            cleaned = re.sub(r"[:\s\-=._]", "", text)
            fixed = fix_ocr_number_typos(cleaned)
            numbers_only = re.sub(r"\D", "", fixed)
            if len(numbers_only) in [15, 17]:
                data["nik"] = numbers_only
                break

    # =======================================================
    # DATA LAIN (Tetap dipertahankan seadanya)
    # =======================================================
    # NAMA
    for i, text in enumerate(texts):
        if "NAMA" in text.upper():
            candidate = re.sub(r"(?i)NAMA\s*[:;.]?\s*", "", text).strip()
            if len(candidate) > 3:
                data["nama"] = candidate
            elif i + 1 < len(texts):
                data["nama"] = texts[i + 1].strip()
            break

    # TEMPAT TGL LAHIR
    for i, text in enumerate(texts):
        if "LAHIR" in text.upper():
            value = re.sub(r"(?i).*LAHIR\s*[:;.]?\s*", "", text).strip()
            if value: data["tempat_tgl_lahir"] = value
            elif i + 1 < len(texts): data["tempat_tgl_lahir"] = texts[i + 1].strip()
            break

    # JENIS KELAMIN
    if "PEREMPUAN" in all_text: data["jenis_kelamin"] = "PEREMPUAN"
    elif "LAKI" in all_text: data["jenis_kelamin"] = "LAKI-LAKI"

    # RT/RW
    rt_match = re.search(r"\d{3}\s*/\s*\d{3}", all_text)
    if rt_match: data["rt_rw"] = rt_match.group().replace(" ", "")

    return data

    # =====================
    # AGAMA
    # =====================
    agama_list = ["ISLAM", "KRISTEN", "KATOLIK", "HINDU", "BUDDHA", "KONGHUCU"]
    for agama in agama_list:
        if agama in all_text:
            data["agama"] = agama
            break

    # =====================
    # STATUS PERKAWINAN
    # =====================
    if "BELUM KAWIN" in all_text:
        data["status_perkawinan"] = "BELUM KAWIN"
    elif "KAWIN" in all_text:
        data["status_perkawinan"] = "KAWIN"
    elif "CERAI HIDUP" in all_text:
        data["status_perkawinan"] = "CERAI HIDUP"
    elif "CERAI MATI" in all_text:
        data["status_perkawinan"] = "CERAI MATI"

    # =====================
    # KEWARGANEGARAAN
    # =====================
    if "WNI" in all_text:
        data["kewarganegaraan"] = "WNI"
    elif "WNA" in all_text:
        data["kewarganegaraan"] = "WNA"

    # =====================
    # BERLAKU HINGGA
    # =====================
    if "SEUMUR HIDUP" in all_text:
        data["berlaku_hingga"] = "SEUMUR HIDUP"

    # =====================
    # ALAMAT
    # =====================
    for i, text in enumerate(texts):
        if "ALAMAT" in text.upper():
            value = re.sub(r"(?i)ALAMAT\s*[:;.]?\s*", "", text).strip()
            if value:
                data["alamat"] = value
            elif i + 1 < len(texts):
                data["alamat"] = texts[i + 1].strip()
            break

    # =====================
    # PEKERJAAN
    # =====================
    for i, text in enumerate(texts):
        if "PEKERJAAN" in text.upper():
            value = re.sub(r"(?i)PEKERJAAN\s*[:;.]?\s*", "", text).strip()
            if value:
                data["pekerjaan"] = value
            elif i + 1 < len(texts):
                data["pekerjaan"] = texts[i + 1].strip()
            break

    # =====================
    # KECAMATAN
    # =====================
    for i, text in enumerate(texts):
        if "KECAMATAN" in text.upper():
            value = re.sub(r"(?i)KECAMATAN\s*[:;.]?\s*", "", text).strip()
            if value:
                data["kecamatan"] = value
            elif i + 1 < len(texts):
                data["kecamatan"] = texts[i + 1].strip()
            break

    return data


@app.post("/ocr")
async def read_images(files: List[UploadFile] = File(...)):
    # Batas dinaikkan menjadi 100 agar cocok dengan skema upload berkala Anda
    if len(files) > 100:
        return {"error": "Maksimal 100 file per hit"}

    results = []
    success = 0
    failed = 0

    for file in files:
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
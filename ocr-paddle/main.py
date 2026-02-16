from fastapi import FastAPI, UploadFile, File
from typing import List
from paddleocr import PaddleOCR
import shutil
import os
import re

app = FastAPI()

# Inisialisasi OCR (sekali saja saat start server)
ocr = PaddleOCR(use_angle_cls=True, lang='en')


def extract_ktp_data(result):
    # Filter confidence > 0.8
    texts = [
        line[1][0].strip()
        for line in result[0]
        if line[1][1] > 0.8
    ]

    data = {}

    for i, text in enumerate(texts):
        text_upper = text.upper().strip()

        # =====================
        # NIK (16 digit valid)
        # =====================
        nik_match = re.search(r"\b\d{16}\b", text)
        if nik_match:
            data["nik"] = nik_match.group()

        # =====================
        # NAMA
        # =====================
        if text_upper == "NAMA":
            if i + 1 < len(texts):
                value = texts[i + 1].strip()
                if len(value) > 2:
                    data["nama"] = value

        # =====================
        # TEMPAT / TGL LAHIR
        # =====================
        if "TEMPAT" in text_upper and "LAHIR" in text_upper:
            if i + 1 < len(texts):
                value = texts[i + 1].strip()
                data["tempat_tgl_lahir"] = value

        # =====================
        # JENIS KELAMIN
        # =====================
        if "LAKI-LAKI" in text_upper:
            data["jenis_kelamin"] = "LAKI-LAKI"

        if "PEREMPUAN" in text_upper:
            data["jenis_kelamin"] = "PEREMPUAN"

        # =====================
        # ALAMAT
        # =====================
        if text_upper == "ALAMAT":
            if i + 1 < len(texts):
                value = texts[i + 1].strip()
                if len(value) > 2:
                    data["alamat"] = value

        # =====================
        # RT / RW
        # =====================
        rt_match = re.search(r"\b\d{3}/\d{3}\b", text)
        if rt_match:
            data["rt_rw"] = rt_match.group()

        # =====================
        # KECAMATAN
        # =====================
        if text_upper == "KECAMATAN":
            if i + 1 < len(texts):
                value = texts[i + 1].strip()
                if len(value) > 2:
                    data["kecamatan"] = value

        # =====================
        # AGAMA
        # =====================
        if text_upper in ["ISLAM", "KRISTEN", "KATOLIK", "HINDU", "BUDDHA"]:
            data["agama"] = text_upper

        # =====================
        # STATUS PERKAWINAN
        # =====================
        if "KAWIN" in text_upper:
            data["status_perkawinan"] = "KAWIN"

        # =====================
        # PEKERJAAN
        # =====================
        if text_upper == "PEKERJAAN":
            if i + 1 < len(texts):
                value = texts[i + 1].strip()
                if len(value) > 2:
                    data["pekerjaan"] = value

        # =====================
        # KEWARGANEGARAAN
        # =====================
        if "WNI" in text_upper:
            data["kewarganegaraan"] = "WNI"

        if "WNA" in text_upper:
            data["kewarganegaraan"] = "WNA"

        # =====================
        # BERLAKU HINGGA
        # =====================
        if "SEUMUR HIDUP" in text_upper:
            data["berlaku_hingga"] = "SEUMUR HIDUP"

    return data


@app.post("/ocr")
async def read_images(files: List[UploadFile] = File(...)):

    if len(files) > 5:
        return {"error": "Maksimal 5 file saja"}

    results = []
    success = 0
    failed = 0

    for file in files:
        try:
            temp_file = f"temp_{file.filename}"

            # Simpan sementara
            with open(temp_file, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            # OCR
            result = ocr.ocr(temp_file)

            # Hapus file sementara
            os.remove(temp_file)

            # Parse hasil
            parsed = extract_ktp_data(result)

            results.append({
                "filename": file.filename,
                "data": parsed
            })

            success += 1

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

from paddleocr import PaddleOCR

print("Loading model...")

ocr = PaddleOCR(use_angle_cls=True, lang='en')

print("Model loaded. Running OCR...")

result = ocr.ocr("ktp9.jpg")

print("\n=== HASIL OCR ===\n")

for line in result[0]:
    print(line[1][0])

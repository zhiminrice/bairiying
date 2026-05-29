#!/usr/bin/env python3
"""
百日营第3组 — 图片文字识别工具
基于 RapidOCR (百度 PP-OCRv4 ONNX)，支持中文/英文/数字
用法: python3 识图工具.py 图片路径
"""

import sys
import json
from rapidocr import RapidOCR

def ocr(image_path):
    """识别图片中的文字，返回 (文本列表, 置信度列表, 耗时)"""
    engine = RapidOCR()
    result = engine(image_path, use_det=True, use_cls=True, use_rec=True)
    
    boxes = result.boxes if hasattr(result, 'boxes') else []
    txts = result.txts if hasattr(result, 'txts') else []
    scores = result.scores if hasattr(result, 'scores') else []
    
    # 按从上到下、从左到右排序
    items = list(zip(txts, boxes, scores))
    items.sort(key=lambda x: (x[1][0][1], x[1][0][0]))
    
    output = []
    for text, box, score in items:
        output.append({"text": text, "confidence": round(float(score), 4)})
    
    return output

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("用法: python3 识图工具.py <图片路径>")
        sys.exit(1)
    
    results = ocr(sys.argv[1])
    for i, item in enumerate(results, 1):
        print(f"[{i:02d}] {item['text']}  🎯{item['confidence']:.1%}")
    
    # 同时输出 JSON 方便程序调用
    print("\n--- JSON ---")
    print(json.dumps(results, ensure_ascii=False, indent=2))

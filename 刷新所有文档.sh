#!/bin/bash
# 百日营第3组 — 一键刷新所有文档
# 用法：在终端运行  bash 刷新所有文档.sh
# 功能：读取「百日营3组学习跟踪表.xlsx」，重新生成所有组员的 Word 档案 + 进度看板

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
EXCEL_FILE="$SCRIPT_DIR/百日营3组学习跟踪表.xlsx"
OUTPUT_DIR="$SCRIPT_DIR/组员档案"

echo "═══════════════════════════════════"
echo "  百日营第3组 — 一键刷新工具"
echo "═══════════════════════════════════"
echo ""

if [ ! -f "$EXCEL_FILE" ]; then
    echo "❌ 找不到 Excel 文件: $EXCEL_FILE"
    echo "   请确保障「百日营3组学习跟踪表.xlsx」与此脚本在同一个文件夹中。"
    exit 1
fi

echo "📊 步骤 1/3：读取 Excel 数据..."
echo "📝 步骤 2/3：生成 Word 档案..."
cd "$SCRIPT_DIR"
node "$(dirname "$0")/refresh_docs_helper.cjs" "$EXCEL_FILE" "$OUTPUT_DIR"

echo ""
echo "📈 步骤 3/3：生成进度看板..."
python3 "$SCRIPT_DIR/refresh_dashboard_helper.py" "$EXCEL_FILE" "$SCRIPT_DIR/进度看板.png"

echo ""
echo "═══════════════════════════════════"
echo "  ✅ 全部刷新完成！"
echo "  📁 Word 档案 → $OUTPUT_DIR"
echo "  📊 进度看板 → $SCRIPT_DIR/进度看板.png"
echo "═══════════════════════════════════"

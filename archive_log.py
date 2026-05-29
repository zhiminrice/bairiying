#!/usr/bin/env python3
"""
百日营第3组 · 操作日志归档脚本

功能:
  1. 周日自动归档: 将操作日志.md中上一周的内容移至 bairiying/操作日志/
  2. 手动归档: python archive_log.py 2026-05-28 (归档该日期之前的内容)
  3. 每日合并: 同一天同类操作自动合并为一行

用法:
  python archive_log.py                    # 归档上周（周日运行）
  python archive_log.py 2026-05-28         # 归档指定日期之前的内容
  python archive_log.py --preview          # 预览归档范围，不实际执行
"""

import os, re, sys
from datetime import datetime, timedelta

WORKSPACE = os.path.dirname(os.path.abspath(__file__))
LOG_FILE = os.path.join(WORKSPACE, '操作日志.md')
ARCHIVE_DIR = os.path.join(WORKSPACE, 'bairiying', '操作日志')


def get_week_label(date_str):
    """根据日期返回周标签，如 W1, W2"""
    dt = datetime.strptime(date_str, '%Y-%m-%d')
    camp_start = datetime(2026, 5, 21)  # 开营日期
    days = (dt - camp_start).days
    week_num = days // 7 + 1
    return f'W{week_num}'


def parse_log_sections(filepath):
    """解析日志文件，返回 [(标题行, 日期, 内容块), ...]"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 找到所有 ## 日期标题
    pattern = r'(## (\d{4}-\d{2}-\d{2})\s.*?\n\n.*?)(?=\n## \d{4}|\Z)'
    matches = list(re.finditer(pattern, content, re.DOTALL))

    sections = []
    for m in matches:
        full = m.group(1)
        date = m.group(2)
        sections.append((full, date))

    return content, sections


def archive(until_date=None, dry_run=False):
    """归档日志"""
    if not os.path.exists(LOG_FILE):
        print('日志文件不存在')
        return

    os.makedirs(ARCHIVE_DIR, exist_ok=True)

    content, sections = parse_log_sections(LOG_FILE)

    if not sections:
        print('日志为空')
        return

    # 确定截止日期
    if until_date is None:
        today = datetime.now()
        # 找到上周日
        days_since_sunday = today.weekday()  # Monday=0, Sunday=6
        if days_since_sunday == 6:
            last_sunday = today
        else:
            last_sunday = today - timedelta(days=days_since_sunday + 1)
        until_date = last_sunday.strftime('%Y-%m-%d')
        print(f'自动归档截止日期（上周日）: {until_date}')

    # 找出需要归档的 section
    to_archive = []
    to_keep = []
    for full, date in sections:
        if date <= until_date:
            to_archive.append((full, date))
        else:
            to_keep.append((full, date))

    if not to_archive:
        print(f'没有需要归档的内容（截止 {until_date}）')
        return

    # 按周分组
    weeks = {}
    for full, date in to_archive:
        wk = get_week_label(date)
        if wk not in weeks:
            weeks[wk] = []
        weeks[wk].append(full.strip())

    if dry_run:
        print(f'\n=== 预览 ===')
        print(f'归档截止: {until_date}')
        print(f'待归档: {len(to_archive)} 天')
        for wk in sorted(weeks.keys()):
            print(f'  {wk}: {len(weeks[wk])} 天')
        print(f'保留: {len(to_keep)} 天')
        return

    # 写入归档文件
    for wk in sorted(weeks.keys()):
        archive_file = os.path.join(ARCHIVE_DIR, f'操作日志_{wk}.md')
        header = f'# 百日营第3组 · 操作日志 {wk}\n\n> 归档时间: {datetime.now().strftime("%Y-%m-%d %H:%M")}\n\n---\n\n'
        with open(archive_file, 'w', encoding='utf-8') as f:
            f.write(header)
            f.write('\n\n---\n\n'.join(weeks[wk]))
            f.write('\n')
        print(f'归档: {archive_file} ({len(weeks[wk])} 天)')

    # 重写当前日志
    header_end = content.index('---\n', content.index('---\n') + 4) + 4  # 第二个 --- 之后
    intro = content[:header_end].strip()

    new_content = intro + '\n\n\n'
    for full, date in to_keep:
        new_content += full.strip() + '\n\n---\n\n'

    with open(LOG_FILE, 'w', encoding='utf-8') as f:
        f.write(new_content.strip() + '\n')

    print(f'\n✅ 归档完成：{len(to_archive)} 天 → bairiying/操作日志/')
    print(f'   当前日志保留: {len(to_keep)} 天')


if __name__ == '__main__':
    dry_run = '--preview' in sys.argv or '--dry-run' in sys.argv

    # 检查是否有指定日期参数
    until_date = None
    for arg in sys.argv[1:]:
        if re.match(r'\d{4}-\d{2}-\d{2}', arg):
            until_date = arg

    archive(until_date, dry_run)

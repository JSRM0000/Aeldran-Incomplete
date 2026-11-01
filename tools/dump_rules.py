"""把规则书里设计需要的几张表导成 UTF-8 TSV，方便在终端/编辑器里直读。

用法：
    python tools/dump_rules.py                # 导出下面 SHEETS 里列出的表
    python tools/dump_rules.py 角色字段 专长     # 只导出指定表

输出目录：tmp-inspect/rules/
"""
import os
import sys

import openpyxl

BOOK = r'F:\Aeldran\规则书\艾尔德兰规则书.xlsx'
OUT = r'F:\Aeldran\tmp-inspect\rules'

SHEETS = [
    '使用说明',
    '角色字段',
    '属性与技能',
    '种族与亚种',
    '职业与子职',
    '专长',
    '背景与身份',
    '外貌与身体',
    '身体与生理',
    '全局规则',
]


def cell(value):
    if value is None:
        return ''
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return str(value).strip()


def main():
    names = sys.argv[1:] or SHEETS
    os.makedirs(OUT, exist_ok=True)
    wb = openpyxl.load_workbook(BOOK, data_only=True)
    for name in names:
        if name not in wb.sheetnames:
            print(f'!! 没有这张表：{name}')
            continue
        ws = wb[name]
        lines = []
        for row in ws.iter_rows(values_only=True):
            cells = [cell(v) for v in row]
            while cells and not cells[-1]:
                cells.pop()
            lines.append('\t'.join(cells))
        path = os.path.join(OUT, f'{name}.tsv')
        with open(path, 'w', encoding='utf-8', newline='\n') as fh:
            fh.write('\n'.join(lines))
        print(f'{name}: {len(lines)} 行 → {path}')


if __name__ == '__main__':
    main()

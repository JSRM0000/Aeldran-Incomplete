"""从规则书生成前端可直接 import 的规则数据。

    python tools/gen_rules.py

读 `规则书/艾尔德兰规则书.xlsx`，写 `src/data/rules.generated.js`。
只做机械转换，不做规则判断；数值/文案请回规则书修改后再重新生成。
"""
import json
import re

import openpyxl

BOOK = r'F:\Aeldran\规则书\艾尔德兰规则书.xlsx'
OUT = r'F:\Aeldran\src\data\rules.generated.js'

ATTR_MAP = {
    '力量': 'str',
    '敏捷': 'dex',
    '体质': 'con',
    '智力': 'int',
    '感知': 'wis',
    '魅力': 'cha',
    '性技': 'sex',
    '羞耻': 'sha',
}

# 性别的身体构造（决定「外貌与身体」里哪些字段出现）
GENDER_BODY = {
    'GENDER-001': [],
    'GENDER-002': ['penis'],
    'GENDER-003': ['vulva', 'breast'],
    'GENDER-004': ['penis'],
    'GENDER-005': ['vulva', 'breast'],
    'GENDER-006': ['penis', 'breast'],
    'GENDER-007': ['vulva'],
    'GENDER-008': ['penis', 'vulva', 'breast'],
    'GENDER-009': ['penis', 'vulva', 'breast'],
}

GENITAL_NEEDS = {
    'APPEARANCE-022': 'penis',
    'APPEARANCE-023': 'penis',
    'APPEARANCE-024': 'penis',
    'APPEARANCE-025': 'penis',
    'APPEARANCE-026': 'penis',
    'APPEARANCE-027': 'penis',
    'APPEARANCE-028': 'vulva',
    'APPEARANCE-029': 'vulva',
    'APPEARANCE-030': 'vulva',
    'APPEARANCE-031': 'vulva',
    'APPEARANCE-032': 'vulva',
    'APPEARANCE-014': 'breast',
    'APPEARANCE-015': 'breast',
}


def text(value):
    return '' if value is None else str(value).strip()


def lines(value):
    raw = text(value)
    return [line.strip() for line in raw.split('\n') if line.strip()]


def parse_bonus(value):
    """「力量+1；敏捷+1」→ {'str': 1, 'dex': 1}"""
    out = {}
    for piece in re.split(r'[；;，,、/]|\s+', text(value)):
        match = re.match(r'^([\u4e00-\u9fa5]+)\s*([+-])\s*(\d+)$', piece.strip())
        if not match:
            continue
        key = ATTR_MAP.get(match.group(1))
        if not key:
            continue
        amount = int(match.group(3))
        out[key] = out.get(key, 0) + (amount if match.group(2) == '+' else -amount)
    return out


def parse_named(lines_in, sep='：'):
    """「名字：说明」→ [{'name':…, 'text':…}]"""
    out = []
    for line in lines_in:
        if sep in line:
            name, body = line.split(sep, 1)
            out.append({'name': name.strip(), 'text': body.strip()})
        else:
            out.append({'name': '', 'text': line})
    return out


SKILL_ALIAS = {'洞察': '洞悉', '体操': '特技'}
SKILL_NAMES = {
    '特技', '驯兽', '奥秘', '运动', '欺瞒', '历史', '洞悉', '威吓', '调查', '医药',
    '自然', '察觉', '表演', '游说', '宗教', '巧手', '隐匿', '求生', '性交',
}


def norm_skill(name):
    name = name.strip().rstrip('。')
    return SKILL_ALIAS.get(name, name)


def split_list(value):
    out = []
    for piece in re.split(r'[、，,]|和', text(value)):
        name = norm_skill(piece)
        if name and (name in SKILL_NAMES or not SKILL_NAMES):
            out.append(name)
    return out


def parse_skills(value):
    raw = text(value)
    match = re.search(r'从(.+?)中选择(.+?)[项个]', raw)
    if match:
        from_list = [norm_skill(p) for p in re.split(r'[、，,]', match.group(1)) if p.strip()]
        count = {'两': 2, '二': 2, '三': 3, '一': 1}.get(match.group(2)[0], 2)
        return {'mode': 'choose', 'count': count, 'from': from_list, 'text': raw}
    return {'mode': 'fixed', 'items': split_list(raw), 'text': raw}


def parse_tools(value):
    raw = text(value)
    match = re.search(r'从(.+?)中选择(.+?)[项个]', raw)
    if match:
        from_list = [p.strip() for p in re.split(r'[、，,]', match.group(1)) if p.strip()]
        from_list = [re.sub(r'^(一种|一套|一个)', '', item) for item in from_list]
        count = {'两': 2, '二': 2, '三': 3, '一': 1}.get(match.group(2)[0], 2)
        return {'mode': 'choose', 'count': count, 'from': from_list, 'text': raw}
    if raw.startswith('自选'):
        return {'mode': 'pick', 'pick': raw[2:], 'text': raw}
    return {'mode': 'fixed', 'items': split_list(raw), 'text': raw}


def load():
    wb = openpyxl.load_workbook(BOOK, data_only=True)

    # ---------- 属性 ----------
    attributes = []
    skills = []
    for row in wb['属性与技能'].iter_rows(min_row=2, values_only=True):
        rid, category, name = text(row[0]), text(row[1]), text(row[2])
        if not rid:
            continue
        label = name.split()[0] if name else ''
        abbr = name.split()[1] if len(name.split()) > 1 else ''
        if category == '属性':
            attributes.append({
                'id': rid,
                'key': ATTR_MAP.get(label, rid.lower()),
                'name': label,
                'abbr': abbr,
                'formula': text(row[4]),
                'min': 0,
                'max': 100 if label in ('性技', '羞耻') else 20,
                'initial': 0 if label == '性技' else (100 if label == '羞耻' else 12),
                'hidden': label in ('性技', '羞耻'),
                'note': text(row[9]),
            })
        elif category == '技能':
            skills.append({
                'id': rid,
                'name': label,
                'ability': text(row[3]),
                'text': text(row[6]),
            })

    # ---------- 种族与亚种 ----------
    races = []
    for row in wb['种族与亚种'].iter_rows(min_row=2, values_only=True):
        rid = text(row[0])
        entry = {
            'subId': text(row[2]),
            'subName': text(row[3]),
            'size': text(row[4]),
            'speed': text(row[5]),
            'ageStage': text(row[6]),
            'lifespan': text(row[7]),
            'bonus': parse_bonus(row[8]),
            'traits': parse_named(lines(row[8])),
            'languages': text(row[9]),
            'talents': parse_named(lines(row[10])),
            'creed': text(row[11]),
            'look': text(row[12]),
            'note': text(row[13]),
        }
        if rid:
            races.append({'id': rid, 'name': text(row[1]), 'rows': [entry]})
        elif races:
            races[-1]['rows'].append(entry)
    for race in races:
        race['hasSubrace'] = len(race['rows']) > 1
        race['base'] = race['rows'][0]
        race['subraces'] = [
            dict(row, id=row['subId'], name=row['subName']) for row in race['rows']
        ] if race['hasSubrace'] else []

    # ---------- 职业 ----------
    classes = []
    for row in wb['职业与子职'].iter_rows(min_row=2, values_only=True):
        rid = text(row[0])
        if not rid:
            continue
        feature_lines = lines(row[7])
        feature = parse_named(feature_lines)[0] if feature_lines else {'name': '', 'text': ''}
        classes.append({
            'id': rid,
            'name': text(row[1]),
            'core': parse_bonus(row[2]),
            'coreText': text(row[2]),
            'hitDie': text(row[3]),
            'armor': text(row[4]),
            'weapons': text(row[5]),
            'saves': text(row[6]),
            'feature': feature,
            'featureText': '\n'.join(feature_lines),
            'combat': text(row[8]),
            'nonCombat': text(row[9]),
            'note': text(row[10]),
        })

    # ---------- 专长 ----------
    feats = {}
    for row in wb['专长'].iter_rows(min_row=2, values_only=True):
        rid = text(row[0])
        if not rid:
            continue
        feats[rid] = {'id': rid, 'name': text(row[1]), 'lines': lines(row[2]), 'note': text(row[3])}

    # ---------- 出身 ----------
    backgrounds = []
    for row in wb['背景与身份'].iter_rows(min_row=2, values_only=True):
        name = text(row[1])
        if not name:
            continue
        feat_lines = lines(row[2])
        feat_id = feat_lines[0] if feat_lines else ''
        backgrounds.append({
            'id': f'BG-{len(backgrounds) + 1:02d}',
            'name': name,
            'featId': feat_id,
            'featName': (feat_lines[1] if len(feat_lines) > 1 else ''),
            'experience': text(row[3]),
            'skills': parse_skills(row[4]),
            'tools': parse_tools(row[5]),
            'languages': text(row[6]),
            'gold': text(row[9]),
            'description': text(row[11]),
        })

    # ---------- 性别 ----------
    genders = []
    for row in wb['身体与生理'].iter_rows(min_row=2, values_only=True):
        rid = text(row[0])
        if not rid.startswith('GENDER-'):
            continue
        genders.append({
            'id': rid,
            'name': text(row[2]),
            'body': text(row[3]),
            'physiology': text(row[4]),
            'parts': GENDER_BODY.get(rid, []),
        })

    # ---------- 外貌与身体 ----------
    groups = []
    current_group = None
    current_group_name = ''
    field = None
    for row in wb['外貌与身体'].iter_rows(min_row=2, values_only=True):
        group = text(row[1])
        label = text(row[2])
        option = text(row[3])
        desc = text(row[4])
        if group and group != current_group_name:
            current_group = {'name': group, 'fields': []}
            current_group_name = group
            groups.append(current_group)
            field = None
        if not current_group:
            continue
        if label:
            custom = option.startswith('自行填充') or option.startswith('可选自行填充')
            field = {
                'id': text(row[0]),
                'group': current_group['name'],
                'label': label,
                'type': 'text' if custom else 'select',
                'options': [],
                'hint': option if custom else '',
                'need': GENITAL_NEEDS.get(text(row[0]), ''),
            }
            current_group['fields'].append(field)
            if custom:
                continue
        if not field:
            continue
        if option and not field['type'] == 'text':
            field['options'].append({'label': option, 'text': desc})
        elif option.startswith('自行填充') and field['type'] == 'text' and not field['hint']:
            field['hint'] = option

    # 只有一个「填充数值」占位选项的字段，改成玩家自行填写的数字输入
    NUMERIC_PLACEHOLDER = ('填充数值', '填写数值', '填写数字')
    NUMERIC_UNIT = {'APPEARANCE-022': 'cm', 'APPEARANCE-023': 'cm'}
    for group in groups:
        for item in group['fields']:
            labels = [opt['label'] for opt in item['options']]
            if item['type'] == 'select' and len(labels) == 1 and labels[0] in NUMERIC_PLACEHOLDER:
                item['type'] = 'number'
                item['options'] = []
                item['hint'] = ''
                item['unit'] = NUMERIC_UNIT.get(item['id'], '')

    # 魅魔天赋原文里的「初始羞耻值为0」与备注「羞耻-80点」冲突，界面上不再展示这一句
    SHAME_PATTERNS = [
        re.compile(r'初始羞耻值[为是]?\s*0\s*[，,；;、]?\s*'),
        re.compile(r'羞耻值为\s*0\s*[，,；;、]?\s*'),
    ]

    def strip_shame(value):
        if isinstance(value, str):
            for pattern in SHAME_PATTERNS:
                value = pattern.sub('', value)
            return value.strip()
        if isinstance(value, list):
            return [strip_shame(item) for item in value]
        if isinstance(value, dict):
            return {key: strip_shame(item) for key, item in value.items()}
        return value

    data = strip_shame({
        'ATTRIBUTES': attributes,
        'SKILLS': skills,
        'RACES': races,
        'CLASSES': classes,
        'FEATS': feats,
        'BACKGROUNDS': backgrounds,
        'GENDERS': genders,
        'APPEARANCE_GROUPS': groups,
    })

    chunks = ['// 由 tools/gen_rules.py 从《艾尔德兰规则书.xlsx》生成，请勿手工编辑。',
              '// 重新生成：python tools/gen_rules.py', '']
    for key, value in data.items():
        body = json.dumps(value, ensure_ascii=False, indent=2)
        chunks.append(f'export const {key} = {body}\n')
    with open(OUT, 'w', encoding='utf-8', newline='\n') as fh:
        fh.write('\n'.join(chunks))

    for key, value in data.items():
        size = len(value) if hasattr(value, '__len__') else 1
        print(f'{key}: {size}')


if __name__ == '__main__':
    load()

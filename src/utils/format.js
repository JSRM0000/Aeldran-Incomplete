const ATTR_ABBR = {
  str: '力',
  dex: '敏',
  con: '体',
  int: '智',
  wis: '感',
  cha: '魅'
}

export const ATTR_ORDER = ['str', 'dex', 'con', 'int', 'wis', 'cha']

/** {str:1,dex:2} → "力+1 敏+2" */
export function bonusText (bonus, fallback = '无') {
  const list = ATTR_ORDER.filter((key) => Number(bonus?.[key])).map((key) => {
    const value = Number(bonus[key])
    return `${ATTR_ABBR[key]}${value > 0 ? '+' : ''}${value}`
  })
  return list.length ? list.join(' ') : fallback
}

/** 0.6 → "×0.6"；1.15 → "×1.15" */
export function mult (value) {
  if (value === null || value === undefined) return '—'
  const rounded = Math.round(value * 100) / 100
  return `×${rounded}`
}

export function signed (value) {
  const rounded = Math.round(value * 100) / 100
  return `${rounded > 0 ? '+' : ''}${rounded}`
}

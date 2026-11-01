// 工具熟练用的占位名目。规则书目前只给了工具类别，具体条目统一用「…工具 A」占位，
// 等规则书补齐后替换这里的数组即可，界面与存档结构不用改。

export const TOOL_KINDS = {
  赌具: ['骰子组 A', '骨牌 A', '牌戏 A'],
  乐器: ['鲁特琴 A', '长笛 A', '手鼓 A'],
  工匠工具: ['铁匠工具 A', '木匠工具 A', '制图工具 A'],
  盗贼工具: ['盗贼工具 A'],
  易容工具: ['易容工具 A'],
  书法工具: ['书法工具 A'],
  制图工具: ['制图工具 A'],
  木匠工具: ['木匠工具 A'],
  领航工具: ['领航工具 A'],
  文书伪造工具: ['文书伪造工具 A']
}

/** 从出身的工具描述里推断出示意图（用于「自选一种乐器」这类文本） */
export function toolKindFrom (text = '') {
  const keys = Object.keys(TOOL_KINDS)
  const hit = keys.find((key) => text.includes(key))
  if (hit) return hit
  if (text.includes('赌')) return '赌具'
  if (text.includes('乐器')) return '乐器'
  if (text.includes('工匠')) return '工匠工具'
  return ''
}

/** 某类工具的具体选项；类别没有登记时给一个通用占位 */
export function toolOptions (kind) {
  return (TOOL_KINDS[kind] || [`${kind} A`]).map((name) => ({ value: name, label: name }))
}

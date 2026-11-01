// 难度设定：引擎侧的数值修正。第一条「平衡」不做任何改动。
// 数值来自设计说明，改动时同步 `项目结构.md`。

export const DIFFICULTIES = [
  {
    id: 'explorer',
    name: '探索者',
    tagline: '一场叙事体验，注重故事胜于战斗',
    accent: '#6f9d7f',
    accentSoft: 'rgba(111, 157, 127, 0.16)',
    boss: { hp: 0.6, dmg: 0.6 },
    mobs: [
      { zone: '郊外', hp: 0.6, dmg: 0.55 },
      { zone: '周边', hp: 0.6, dmg: 0.55 },
      { zone: '浅层', hp: 0.6, dmg: 0.55 },
      { zone: '中层以下', hp: 0.6, dmg: 0.55 }
    ],
    climax: { self: 0.7, enemy: 1.2 }
  },
  {
    id: 'balanced',
    name: '平衡',
    tagline: '一场标准体验，独特冒险由您抉择',
    accent: '#c39a4a',
    accentSoft: 'rgba(195, 154, 74, 0.18)',
    boss: null,
    mobs: [],
    climax: null
  },
  {
    id: 'hardcore',
    name: '硬核',
    tagline: '一场困难体验，策略机敏缺一不可',
    accent: '#a8442f',
    accentSoft: 'rgba(168, 68, 47, 0.18)',
    boss: { hp: 1.15, dmg: 0.88 },
    mobs: [
      { zone: '郊外', hp: 1.15, dmg: 1.01 },
      { zone: '周边', hp: 1.15, dmg: 1.05 },
      { zone: '浅层', hp: 1.15, dmg: 1.33 },
      { zone: '中层以下', hp: 1.15, dmg: 1.87 }
    ],
    climax: { self: 1.2, enemy: 0.7 }
  }
]

export const DEFAULT_DIFFICULTY = 'balanced'

export function findDifficulty (id) {
  return DIFFICULTIES.find((item) => item.id === id) || DIFFICULTIES[1]
}

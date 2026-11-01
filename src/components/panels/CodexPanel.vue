<script setup>
import { computed, ref } from 'vue'
import ParchmentDialog from '../ParchmentDialog.vue'

defineEmits(['close'])

const tabs = [
  {
    id: 'people',
    name: '人物',
    entries: [
      {
        title: '灰烬旅人',
        tag: '无名者',
        text: '一个在灰烬里醒来的人。没有过去，只有一枚断裂的剑柄，以及一个无人能读懂的纹章。'
      },
      {
        title: '灰袍书记官',
        tag: '王庭旧臣',
        text: '他替死者记账，也替活人保密。腰间那串钥匙，据说能打开王庭的地下三层。'
      },
      {
        title: '长夜旅店的老板娘',
        tag: '情报 · 中',
        text: '没人记得她真正的名字。只要价码合适，她知道王国里所有不该被知道的事。'
      },
      {
        title: '无名的骑士',
        tag: '失踪',
        text: '铁甲上覆满灰烬，长枪插在渡口的石阶上。人们说，他还在等一个不会来的号令。'
      }
    ]
  },
  {
    id: 'places',
    name: '地域',
    entries: [
      {
        title: '灰烬王庭',
        tag: '王国腹地',
        text: '旧日的王都。城墙依旧完整，钟楼却再未敲响。灰烬从三月前开始落，无人知晓源头。'
      },
      {
        title: '长夜旅店',
        tag: '旅店 · 安全',
        text: '王庭里唯一还亮着灯的屋子。壁炉中的火从不为客人熄灭，也从不让客人久留。'
      },
      {
        title: '银桥渡口',
        tag: '边境 · 危险',
        text: '三座石桥横过灰水河，桥上刻着历代通行者的名字。最新的那一行，墨迹还很湿。'
      },
      {
        title: '白石高地',
        tag: '荒野',
        text: '风把草压向同一个方向。高地上的旧祭坛仍在运转，只是祭品换成了道路本身。'
      }
    ]
  },
  {
    id: 'records',
    name: '记事',
    entries: [
      {
        title: '王庭陷落',
        tag: '纪年 · 三月前',
        text: '没有攻城，没有号角。清晨的钟声敲到一半就停了，此后王庭再无人声。'
      },
      {
        title: '商队失踪',
        tag: '纪年 · 十九日前',
        text: '七车盐、四车布，以及一封盖了双重火漆的信。车队在灰烬里留下最后一道车辙。'
      },
      {
        title: '旧王遗诏',
        tag: '文献 · 残缺',
        text: '「……若钟声止息，则王座当空，直至有人举火。」后半页被整齐地割去了。'
      },
      {
        title: '灰烬纪年',
        tag: '历法',
        text: '自王庭陷落起，人们改以灰烬落下的次数计日。今日是第九十七次。'
      }
    ]
  }
]

const active = ref('people')
const current = computed(() => tabs.find((tab) => tab.id === active.value) ?? tabs[0])
</script>

<template>
  <ParchmentDialog
    open
    wide
    kicker="CODEX"
    title="世界书"
    subtitle="你所知的一切，都只是别人愿意让你知道的部分。"
    @close="$emit('close')"
  >
    <div class="tabs" role="tablist">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        role="tab"
        class="tab"
        :class="{ 'is-on': active === tab.id }"
        :aria-selected="active === tab.id"
        @click="active = tab.id"
      >
        {{ tab.name }}
      </button>
    </div>

    <ul class="entries">
      <li v-for="entry in current.entries" :key="entry.title" class="entry">
        <div class="entry__head">
          <h3 class="entry__title">{{ entry.title }}</h3>
          <span class="entry__tag">{{ entry.tag }}</span>
        </div>
        <p class="entry__text">{{ entry.text }}</p>
      </li>
    </ul>

    <template #footer>
      <button class="btn btn--ghost" type="button" @click="$emit('close')">合上书页</button>
    </template>
  </ParchmentDialog>
</template>

<style scoped>
.tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 14px;
  border-bottom: 1px solid rgba(122, 86, 38, 0.28);
}

.tab {
  position: relative;
  padding: 9px 18px 11px;
  color: rgba(90, 62, 26, 0.66);
  font-family: var(--font-flavor);
  font-size: 14.5px;
  letter-spacing: 0.16em;
  text-indent: 0.16em;
  transition: color 0.3s var(--ease-out);
}

.tab::after {
  content: "";
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: -1px;
  height: 2px;
  background: linear-gradient(90deg, rgba(196, 152, 74, 0), rgba(196, 152, 74, 0.95), rgba(196, 152, 74, 0));
  opacity: 0;
  transform: scaleX(0.4);
  transition: opacity 0.35s var(--ease-out), transform 0.35s var(--ease-out);
}

.tab:hover {
  color: var(--ink-700);
}

.tab.is-on {
  color: var(--ink-900);
}

.tab.is-on::after {
  opacity: 1;
  transform: scaleX(1);
}

.entries {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.entry {
  padding: 13px 15px;
  border: 1px solid rgba(126, 92, 44, 0.3);
  border-radius: 2px;
  background: rgba(255, 250, 235, 0.28);
  transition: border-color 0.32s var(--ease-out), background 0.32s var(--ease-out);
}

.entry:hover {
  border-color: rgba(158, 114, 40, 0.62);
  background: rgba(255, 250, 235, 0.5);
}

.entry__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

.entry__title {
  color: var(--ink-800);
  font-family: var(--font-flavor);
  font-size: 15.5px;
  font-weight: 600;
  letter-spacing: 0.1em;
}

.entry__tag {
  flex: 0 0 auto;
  color: rgba(107, 76, 33, 0.6);
  font-size: 10.5px;
  letter-spacing: 0.14em;
}

.entry__text {
  color: rgba(74, 49, 20, 0.76);
  font-family: var(--font-flavor);
  font-size: 12.5px;
  line-height: 1.75;
  letter-spacing: 0.02em;
}

@media (max-width: 640px) {
  .entries {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>

import Cron from 'react-js-cron'
import 'react-js-cron/dist/styles.css'
import { Input } from 'antd'

const ZH_CN_LOCALE = {
  everyText: '每',
  emptyMonths: '请选择月份',
  emptyMonthDays: '请选择日期',
  emptyMonthDaysShort: '请选择日',
  emptyWeekDays: '请选择星期',
  emptyWeekDaysShort: '请选择',
  emptyHours: '请选择小时',
  emptyMinutes: '请选择分钟',
  emptyMinutesForHourPeriod: '请选择分钟',
  yearOption: '年',
  monthOption: '月',
  weekOption: '周',
  dayOption: '天',
  hourOption: '小时',
  minuteOption: '分钟',
  rebootOption: '重启时',
  prefixPeriod: '每',
  prefixMonths: '的',
  prefixMonthDays: '第',
  prefixWeekDays: '的',
  prefixWeekDaysForMonthAndYearPeriod: '天且',
  prefixHours: '的',
  prefixMinutes: ':',
  prefixMinutesForHourPeriod: '每',
  suffixMinutesForHourPeriod: '分钟',
  errorInvalidCron: '无效的 Cron 表达式',
  clearButtonText: '清空',
  weekDays: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
  months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  altWeekDays: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
  altMonths: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
}

interface CronInputProps {
  value?: string
  onChange?: (v: string) => void
}

export const CronInput = ({ value = '', onChange }: CronInputProps) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Input value={value} onChange={(e) => onChange?.(e.target.value)} placeholder="0 * * * *" />
      <Cron value={value} setValue={(v: string) => onChange?.(v)} locale={ZH_CN_LOCALE} />
    </div>
  )
}

import { useState } from 'react'
import { View, Text, Input, Button } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useShopStore } from '../../store/shopStore'
import { useAuthStore } from '../../store/authStore'
import { getSummary, getTrend, getCategoryDistribution, getTopInventory } from '../../services/statisticsApi'
import './index.scss'

function getDateStr(offsetDays: number) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

export default function StatisticsPage() {
  const { currentShop } = useShopStore()
  const { user } = useAuthStore()
  const [summary, setSummary] = useState<any>(null)
  const [trend, setTrend] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [topInventory, setTopInventory] = useState<any[]>([])
  const [startDate, setStartDate] = useState(getDateStr(-6))
  const [endDate, setEndDate] = useState(getDateStr(0))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  if (user?.role !== 'owner') {
    return <View className='no-permission'><Text>无权限访问统计页面</Text></View>
  }

  const fetchAll = async () => {
    if (!currentShop) return
    setLoading(true)
    setError(false)
    try {
      // 逐个请求，避免一个失败影响其他
      const [s, t, c, top] = await Promise.all([
        getSummary(currentShop.id).catch(() => null),
        getTrend(currentShop.id, startDate, endDate).catch(() => null),
        getCategoryDistribution(currentShop.id).catch(() => null),
        getTopInventory(currentShop.id).catch(() => null),
      ])
      if (s) setSummary(s.data)
      if (t) setTrend(t.data)
      if (c) setCategories(c.data || [])
      if (top) setTopInventory(top.data || [])
      if (!s && !t && !c && !top) setError(true)
    } finally {
      setLoading(false)
    }
  }

  useDidShow(() => { fetchAll() })

  const hasTrendData = trend && (trend.inbound.some((v: number) => v > 0) || trend.outbound.some((v: number) => v > 0))

  return (
    <View className='statistics-page'>
      {loading && <View className='loading'><Text>加载中...</Text></View>}
      {error && (
        <View className='error-bar'>
          <Text>加载失败，</Text>
          <Text className='retry' onClick={fetchAll}>点击重试</Text>
        </View>
      )}
      {/* Summary Cards */}
      {summary && (
        <View className='summary-grid'>
          {[
            { label: '今日入库', value: summary.todayInbound, color: '#52c41a' },
            { label: '今日出库', value: summary.todayOutbound, color: '#ff4d4f' },
            { label: '商品种类', value: summary.productCount, color: '#1890ff' },
            { label: '库存预警', value: summary.alertCount, color: '#faad14' },
          ].map((item) => (
            <View key={item.label} className='summary-card'>
              <Text className='summary-value' style={{ color: item.color }}>{item.value}</Text>
              <Text className='summary-label'>{item.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Trend Section */}
      <View className='section'>
        <Text className='section-title'>出入库趋势</Text>
        <View className='date-row'>
          <Input className='date-input' value={startDate} onInput={(e: any) => setStartDate(e.detail.value)} />
          <Text className='sep'>~</Text>
          <Input className='date-input' value={endDate} onInput={(e: any) => setEndDate(e.detail.value)} />
          <Button className='query-btn' onClick={fetchAll}>查询</Button>
        </View>
        {hasTrendData ? (
          <View className='trend-chart'>
            {trend.dates.map((date: string, i: number) => (
              <View key={date} className='trend-col'>
                <View className='bars'>
                  <View className='bar in' style={{ height: `${Math.min(trend.inbound[i] * 2, 120)}px` }} />
                  <View className='bar out' style={{ height: `${Math.min(trend.outbound[i] * 2, 120)}px` }} />
                </View>
                <Text className='date-label'>{date.slice(5)}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View className='no-data'><Text>暂无数据</Text></View>
        )}
        <View className='legend'>
          <View className='legend-item'><View className='dot in' /><Text>入库</Text></View>
          <View className='legend-item'><View className='dot out' /><Text>出库</Text></View>
        </View>
      </View>

      {/* Category Distribution */}
      <View className='section'>
        <Text className='section-title'>分类库存占比</Text>
        {categories.length > 0 ? (
          <View className='category-list'>
            {categories.map((c: any) => (
              <View key={c.category} className='category-item'>
                <Text className='cat-name'>{c.category}</Text>
                <View className='progress-bar'>
                  <View className='progress-fill' style={{ width: `${c.percentage}%` }} />
                </View>
                <Text className='cat-pct'>{c.percentage.toFixed(1)}%</Text>
              </View>
            ))}
          </View>
        ) : (
          <View className='no-data'><Text>暂无数据</Text></View>
        )}
      </View>

      {/* Top Inventory */}
      <View className='section'>
        <Text className='section-title'>库存 Top 10</Text>
        {topInventory.length > 0 ? (
          <View className='top-list'>
            {topInventory.map((item: any, idx: number) => (
              <View key={item.productId} className='top-item'>
                <Text className={`rank ${idx < 3 ? 'top3' : ''}`}>{idx + 1}</Text>
                <Text className='top-name'>{item.name}</Text>
                <Text className='top-qty'>{item.quantity}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View className='no-data'><Text>暂无数据</Text></View>
        )}
      </View>
    </View>
  )
}

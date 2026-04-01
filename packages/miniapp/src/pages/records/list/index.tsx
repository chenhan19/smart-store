import { useState, useRef } from 'react'
import { View, Text, Input, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useShopStore } from '../../../store/shopStore'
import { getRecords } from '../../../services/recordApi'
import './index.scss'

const TYPE_OPTIONS = [
  { label: '全部', value: '' },
  { label: '入库', value: 'in' },
  { label: '出库', value: 'out' },
]

export default function RecordsListPage() {
  const { currentShop } = useShopStore()
  const [records, setRecords] = useState<any[]>([])
  const [keyword, setKeyword] = useState('')
  const [type, setType] = useState<'' | 'in' | 'out'>('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const fetchRecords = async (reset = true) => {
    if (!currentShop) return
    const nextPage = reset ? 1 : page + 1
    setLoading(true)
    try {
      const res = await getRecords(currentShop.id, {
        keyword, type: type || undefined, startDate: startDate || undefined,
        endDate: endDate || undefined, page: nextPage, pageSize: 20,
      })
      const list = res.data?.list || []
      setTotal(res.data?.total || 0)
      setRecords(reset ? list : (prev) => [...prev, ...list])
      setPage(nextPage)
      setHasMore(list.length === 20)
    } finally {
      setLoading(false)
    }
  }

  useDidShow(() => { fetchRecords(true) })

  const handleLoadMore = () => {
    if (!loading && hasMore) fetchRecords(false)
  }

  return (
    <View className='records-list-page'>
      <View className='filters'>
        <Input className='search-input' value={keyword} placeholder='搜索商品名称或编码'
          onInput={(e) => setKeyword(e.detail.value)} onConfirm={() => fetchRecords(true)} />
        <View className='type-tabs'>
          {TYPE_OPTIONS.map((opt) => (
            <Text key={opt.value} className={`tab ${type === opt.value ? 'active' : ''}`}
              onClick={() => { setType(opt.value as any); fetchRecords(true) }}>
              {opt.label}
            </Text>
          ))}
        </View>
        <View className='date-row'>
          <Input className='date-input' value={startDate} placeholder='开始日期 YYYY-MM-DD'
            onInput={(e) => setStartDate(e.detail.value)} onConfirm={() => fetchRecords(true)} />
          <Text className='date-sep'>~</Text>
          <Input className='date-input' value={endDate} placeholder='结束日期 YYYY-MM-DD'
            onInput={(e) => setEndDate(e.detail.value)} onConfirm={() => fetchRecords(true)} />
        </View>
      </View>

      <Text className='total-text'>共 {total} 条记录</Text>

      <ScrollView scrollY className='list' onScrollToLower={handleLoadMore}>
        {records.map((r) => (
          <View key={r.id} className='record-item'>
            <View className='left'>
              <Text className={`type-badge ${r.type === 'in' ? 'in' : 'out'}`}>{r.type === 'in' ? '入库' : '出库'}</Text>
              <View className='info'>
                <Text className='product-name'>{r.product?.name || '-'}</Text>
                <Text className='operator'>{r.operator?.nickname || '操作员'} · {new Date(r.createdAt).toLocaleString()}</Text>
              </View>
            </View>
            <Text className={`qty ${r.type === 'in' ? 'in' : 'out'}`}>
              {r.type === 'in' ? '+' : '-'}{r.quantity}
            </Text>
          </View>
        ))}
        {loading && <View className='loading'><Text>加载中...</Text></View>}
        {!hasMore && records.length > 0 && <View className='no-more'><Text>没有更多了</Text></View>}
        {!loading && records.length === 0 && <View className='empty'><Text>暂无记录</Text></View>}
      </ScrollView>
    </View>
  )
}

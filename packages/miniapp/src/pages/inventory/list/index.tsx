import { useState } from 'react'
import { View, Text, Input, Picker } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useShopStore } from '../../../store/shopStore'
import { getInventory } from '../../../services/inventoryApi'
import './index.scss'

export default function InventoryListPage() {
  const { currentShop } = useShopStore()
  const [items, setItems] = useState<any[]>([])
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchInventory = async (kw = keyword, cat = category) => {
    if (!currentShop) return
    setLoading(true)
    try {
      const res = await getInventory(currentShop.id, { keyword: kw, category: cat })
      setItems(res.data || [])
    } finally {
      setLoading(false)
    }
  }

  useDidShow(() => { fetchInventory() })

  return (
    <View className='inventory-list-page'>
      <View className='filters'>
        <Input
          className='search-input'
          value={keyword}
          placeholder='搜索商品名称或编码'
          onInput={(e) => setKeyword(e.detail.value)}
          onConfirm={() => fetchInventory()}
        />
        <Input
          className='category-input'
          value={category}
          placeholder='按分类筛选'
          onInput={(e) => setCategory(e.detail.value)}
          onConfirm={() => fetchInventory()}
        />
      </View>

      <View className='list'>
        {items.map((item) => (
          <View
            key={item.productId}
            className={`inventory-item ${item.isAlert ? 'alert' : ''}`}
            onClick={() => Taro.navigateTo({ url: `/pages/product/detail/index?id=${item.productId}` })}
          >
            <View className='info'>
              <View className='name-row'>
                <Text className='name'>{item.name}</Text>
                {item.isAlert && <Text className='alert-badge'>⚠️ 库存预警</Text>}
              </View>
              <Text className='code'>{item.code}</Text>
              <Text className='meta'>{item.category} · {item.spec} · {item.unit}</Text>
            </View>
            <View className='qty-area'>
              <Text className={`qty ${item.isAlert ? 'alert-qty' : ''}`}>{item.quantity}</Text>
            </View>
          </View>
        ))}
        {!loading && items.length === 0 && <View className='empty'><Text>暂无库存数据</Text></View>}
      </View>
    </View>
  )
}

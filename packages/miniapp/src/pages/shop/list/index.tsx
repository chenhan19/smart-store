import { useEffect, useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useShopStore } from '../../../store/shopStore'
import { getShops } from '../../../services/shopApi'
import './index.scss'

export default function ShopListPage() {
  const { shops, setShops, setCurrentShop } = useShopStore()
  const [loading, setLoading] = useState(false)

  const fetchShops = async () => {
    setLoading(true)
    try {
      const res = await getShops()
      setShops(res.data || [])
    } finally {
      setLoading(false)
    }
  }

  useDidShow(() => {
    fetchShops()
  })

  const handleSelect = (shop: any) => {
    setCurrentShop(shop)
    Taro.switchTab({ url: '/pages/home/index' })
  }

  const handleCreate = () => {
    Taro.navigateTo({ url: '/pages/shop/create/index' })
  }

  return (
    <View className='shop-list-page'>
      <View className='header'>
        <Text className='title'>选择店铺</Text>
        <Text className='add-btn' onClick={handleCreate}>+ 新建</Text>
      </View>

      {loading ? (
        <View className='loading'><Text>加载中...</Text></View>
      ) : (
        <View className='list'>
          {shops.map((shop) => (
            <View key={shop.id} className='shop-item' onClick={() => handleSelect(shop)}>
              <View className='shop-info'>
                <Text className='shop-name'>{shop.name}</Text>
                <Text className='shop-date'>{new Date(shop.createdAt).toLocaleDateString()}</Text>
              </View>
              <Text className='arrow'>›</Text>
            </View>
          ))}
          {shops.length === 0 && (
            <View className='empty'>
              <Text>暂无店铺，请先创建</Text>
            </View>
          )}
        </View>
      )}
    </View>
  )
}

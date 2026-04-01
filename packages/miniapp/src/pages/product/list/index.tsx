import { useState } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useShopStore } from '../../../store/shopStore'
import { getProducts } from '../../../services/productApi'
import './index.scss'

export default function ProductListPage() {
  const { currentShop } = useShopStore()
  const [products, setProducts] = useState<any[]>([])
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchProducts = async (kw = keyword) => {
    if (!currentShop) return
    setLoading(true)
    try {
      const res = await getProducts(currentShop.id, { keyword: kw })
      setProducts(res.data || [])
    } finally {
      setLoading(false)
    }
  }

  useDidShow(() => { fetchProducts() })

  return (
    <View className='product-list-page'>
      <View className='search-bar'>
        <Input
          className='search-input'
          value={keyword}
          placeholder='搜索商品名称或编码'
          onInput={(e) => setKeyword(e.detail.value)}
          onConfirm={() => fetchProducts()}
        />
      </View>

      <View className='list'>
        {products.map((p) => (
          <View key={p.id} className='product-item' onClick={() => Taro.navigateTo({ url: `/pages/product/detail/index?id=${p.id}` })}>
            <View className='info'>
              <Text className='name'>{p.name}</Text>
              <Text className='code'>{p.code}</Text>
              <Text className='category'>{p.category}</Text>
            </View>
            <View className='right'>
              <Text className='qty'>{p.inventory?.quantity ?? 0}</Text>
              <Text className='qty-label'>库存</Text>
            </View>
          </View>
        ))}
        {!loading && products.length === 0 && <View className='empty'><Text>暂无商品</Text></View>}
      </View>

      <View className='fab' onClick={() => Taro.navigateTo({ url: '/pages/product/edit/index' })}>
        <Text>+</Text>
      </View>
    </View>
  )
}

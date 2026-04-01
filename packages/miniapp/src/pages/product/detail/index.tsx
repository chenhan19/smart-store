import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useRouter, useDidShow } from '@tarojs/taro'
import { useShopStore } from '../../../store/shopStore'
import { getProductById } from '../../../services/productApi'
import { getRecords } from '../../../services/recordApi'
import './index.scss'

export default function ProductDetailPage() {
  const router = useRouter()
  const productId = parseInt(router.params.id || '0')
  const { currentShop } = useShopStore()
  const [product, setProduct] = useState<any>(null)
  const [records, setRecords] = useState<any[]>([])

  useDidShow(async () => {
    if (!currentShop || !productId) return
    const [pRes, rRes] = await Promise.all([
      getProductById(currentShop.id, productId),
      getRecords(currentShop.id, { keyword: '', pageSize: 30 }),
    ])
    setProduct(pRes.data)
    setRecords(rRes.data?.list || [])
  })

  if (!product) return <View className='loading'><Text>加载中...</Text></View>

  return (
    <View className='product-detail-page'>
      <View className='card'>
        <View className='row'><Text className='label'>商品名称</Text><Text className='value'>{product.name}</Text></View>
        <View className='row'><Text className='label'>商品编码</Text><Text className='value'>{product.code}</Text></View>
        <View className='row'><Text className='label'>分类</Text><Text className='value'>{product.category || '-'}</Text></View>
        <View className='row'><Text className='label'>规格</Text><Text className='value'>{product.spec || '-'}</Text></View>
        <View className='row'><Text className='label'>单位</Text><Text className='value'>{product.unit || '-'}</Text></View>
        <View className='row'><Text className='label'>当前库存</Text><Text className='value highlight'>{product.inventory?.quantity ?? 0}</Text></View>
      </View>

      <View className='edit-btn' onClick={() => Taro.navigateTo({ url: `/pages/product/edit/index?id=${product.id}&name=${product.name}` })}>
        <Text>编辑商品</Text>
      </View>

      <Text className='section-title'>最近出入库记录</Text>
      <View className='records'>
        {records.map((r: any) => (
          <View key={r.id} className='record-item'>
            <Text className={`type ${r.type === 'in' ? 'in' : 'out'}`}>{r.type === 'in' ? '入库' : '出库'}</Text>
            <Text className='qty'>{r.type === 'in' ? '+' : '-'}{r.quantity}</Text>
            <Text className='time'>{new Date(r.createdAt).toLocaleString()}</Text>
          </View>
        ))}
        {records.length === 0 && <View className='empty'><Text>暂无记录</Text></View>}
      </View>
    </View>
  )
}

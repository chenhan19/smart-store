import { useState } from 'react'
import { View, Text, Input, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useShopStore } from '../../store/shopStore'
import { getProductByCode } from '../../services/productApi'
import { inbound } from '../../services/stockApi'
import './index.scss'

export default function InboundPage() {
  const { currentShop } = useShopStore()
  const [product, setProduct] = useState<any>(null)
  const [quantity, setQuantity] = useState('')
  const [updatedQty, setUpdatedQty] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  const handleScan = async () => {
    try {
      const { result } = await Taro.scanCode({ onlyFromCamera: false })
      if (!currentShop) return
      const res = await getProductByCode(currentShop.id, result)
      setProduct(res.data)
      setQuantity('')
      setUpdatedQty(null)
    } catch (err: any) {
      if (err?.message?.includes('未找到')) {
        Taro.showModal({
          title: '未找到商品',
          content: '未找到商品，请先添加商品信息',
          confirmText: '去添加',
          success: ({ confirm }) => {
            if (confirm) Taro.navigateTo({ url: '/pages/product/edit/index' })
          },
        })
      }
    }
  }

  const handleSubmit = async () => {
    if (!product || !currentShop) return
    const qty = parseInt(quantity)
    if (!Number.isInteger(qty) || qty <= 0) {
      Taro.showToast({ title: '入库数量必须为正整数', icon: 'none' })
      return
    }
    setLoading(true)
    try {
      const res = await inbound(currentShop.id, { productId: product.id, quantity: qty })
      setUpdatedQty(res.data.updatedInventory.quantity)
      Taro.showToast({ title: '入库成功', icon: 'success' })
      setProduct(null)
      setQuantity('')
    } catch {
      // handled in request
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className='inbound-page'>
      <Button className='scan-btn' onClick={handleScan}>📷 扫码识别商品</Button>

      {product && (
        <View className='product-card'>
          <View className='row'><Text className='label'>商品名称</Text><Text className='value'>{product.name}</Text></View>
          <View className='row'><Text className='label'>规格</Text><Text className='value'>{product.spec || '-'}</Text></View>
          <View className='row'><Text className='label'>当前库存</Text><Text className='value highlight'>{product.inventory?.quantity ?? 0}</Text></View>

          <View className='qty-input-row'>
            <Text className='label'>入库数量</Text>
            <Input
              className='qty-input'
              type='number'
              value={quantity}
              placeholder='请输入正整数'
              onInput={(e) => setQuantity(e.detail.value)}
            />
          </View>

          <Button className='submit-btn' loading={loading} disabled={loading} onClick={handleSubmit}>
            确认入库
          </Button>
        </View>
      )}

      {updatedQty !== null && (
        <View className='result-card'>
          <Text className='result-text'>✅ 入库成功</Text>
          <Text className='result-qty'>更新后库存：{updatedQty}</Text>
        </View>
      )}

      {!product && updatedQty === null && (
        <View className='hint'><Text>请点击上方按钮扫描商品条形码或二维码</Text></View>
      )}
    </View>
  )
}

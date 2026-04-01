import { useState } from 'react'
import { View, Text, Input, Button } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useShopStore } from '../../../store/shopStore'
import { createProduct, updateProduct, getProductById } from '../../../services/productApi'
import './index.scss'

export default function ProductEditPage() {
  const router = useRouter()
  const productId = router.params.id ? parseInt(router.params.id) : null
  const { currentShop } = useShopStore()

  const [form, setForm] = useState({ name: '', code: '', category: '', spec: '', unit: '' })
  const [loading, setLoading] = useState(false)

  const setField = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = async () => {
    if (!form.name.trim()) { Taro.showToast({ title: '商品名称不能为空', icon: 'none' }); return }
    if (!productId && !form.code.trim()) { Taro.showToast({ title: '商品编码不能为空', icon: 'none' }); return }
    if (!currentShop) return

    setLoading(true)
    try {
      if (productId) {
        await updateProduct(currentShop.id, productId, { name: form.name, category: form.category, spec: form.spec, unit: form.unit })
      } else {
        await createProduct(currentShop.id, form)
      }
      Taro.showToast({ title: productId ? '修改成功' : '创建成功', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 1000)
    } catch {
      // handled in request
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className='product-edit-page'>
      {[
        { label: '商品名称 *', field: 'name', placeholder: '请输入商品名称' },
        { label: '商品编码 *', field: 'code', placeholder: '请输入商品编码', disabled: !!productId },
        { label: '分类', field: 'category', placeholder: '请输入商品分类' },
        { label: '规格', field: 'spec', placeholder: '请输入规格' },
        { label: '单位', field: 'unit', placeholder: '请输入单位' },
      ].map(({ label, field, placeholder, disabled }) => (
        <View key={field} className='form-item'>
          <Text className='label'>{label}</Text>
          <Input
            className='input'
            value={form[field as keyof typeof form]}
            placeholder={placeholder}
            disabled={disabled}
            onInput={(e) => setField(field, e.detail.value)}
          />
        </View>
      ))}

      <Button className='submit-btn' loading={loading} disabled={loading} onClick={handleSubmit}>
        {productId ? '保存修改' : '创建商品'}
      </Button>
    </View>
  )
}

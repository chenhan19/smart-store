import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. 创建管理员用户
  console.log('Creating admin user...');
  const adminUser = await prisma.user.upsert({
    where: { openid: 'admin_openid_123456' },
    update: {},
    create: {
      openid: 'admin_openid_123456',
      username: '管理员',
      email: 'admin@smartstore.com',
      phone: '13800138000',
      role: 'admin',
      status: 'active',
    },
  });

  // 2. 创建店铺店主用户
  console.log('Creating store owner user...');
  const storeOwner = await prisma.user.upsert({
    where: { openid: 'owner_openid_789012' },
    update: {},
    create: {
      openid: 'owner_openid_789012',
      username: '张老板',
      phone: '13900139000',
      role: 'store_owner',
      status: 'active',
    },
  });

  // 3. 创建店员用户
  console.log('Creating employee user...');
  const employee = await prisma.user.upsert({
    where: { openid: 'employee_openid_345678' },
    update: {},
    create: {
      openid: 'employee_openid_345678',
      username: '李店员',
      phone: '13600136000',
      role: 'employee',
      status: 'active',
    },
  });

  // 4. 为用户创建偏好设置
  console.log('Creating user preferences...');
  await Promise.all([
    prisma.userPreference.upsert({
      where: { userId: adminUser.id },
      update: {},
      create: {
        userId: adminUser.id,
        language: 'zh-CN',
        theme: 'light',
        currency: 'CNY',
        notifications: true,
      },
    }),
    prisma.userPreference.upsert({
      where: { userId: storeOwner.id },
      update: {},
      create: {
        userId: storeOwner.id,
        language: 'zh-CN',
        theme: 'light',
        currency: 'CNY',
        notifications: true,
      },
    }),
    prisma.userPreference.upsert({
      where: { userId: employee.id },
      update: {},
      create: {
        userId: employee.id,
        language: 'zh-CN',
        theme: 'light',
        currency: 'CNY',
        notifications: true,
      },
    }),
  ]);

  // 5. 创建店铺
  console.log('Creating stores...');
  const mainStore = await prisma.store.create({
    data: {
      userId: storeOwner.id,
      name: '旗舰店',
      description: '位于市中心的旗舰店面',
      address: '北京市朝阳区建国路88号',
      phone: '010-88888888',
      cameraStreamUrl: 'rtsp://example.com/camera1',
      status: 'active',
    },
  });

  const branchStore = await prisma.store.create({
    data: {
      userId: storeOwner.id,
      name: '分店一',
      description: '位于商业区的分店',
      address: '北京市海淀区中关村大街1号',
      phone: '010-66666666',
      status: 'active',
    },
  });

  // 6. 创建监控摄像头
  console.log('Creating cameras...');
  await prisma.camera.createMany({
    data: [
      {
        storeId: mainStore.id,
        name: '入口摄像头',
        streamUrl: 'rtsp://example.com/entry-camera',
        position: '入口',
        status: 'active',
      },
      {
        storeId: mainStore.id,
        name: '收银台摄像头',
        streamUrl: 'rtsp://example.com/cashier-camera',
        position: '收银台',
        status: 'active',
      },
    ],
  });

  // 7. 创建货架
  console.log('Creating shelves...');
  const shelves = await prisma.shelf.createMany({
    data: [
      {
        storeId: mainStore.id,
        labelName: 'A-01',
        description: '饮料货架',
        position: 'A1',
        capacity: 200,
        currentOccupancy: 0,
        status: 'active',
      },
      {
        storeId: mainStore.id,
        labelName: 'A-02',
        description: '零食货架',
        position: 'A2',
        capacity: 300,
        currentOccupancy: 0,
        status: 'active',
      },
      {
        storeId: mainStore.id,
        labelName: 'B-01',
        description: '日用品货架',
        position: 'B1',
        capacity: 150,
        currentOccupancy: 0,
        status: 'active',
      },
      {
        storeId: branchStore.id,
        labelName: 'C-01',
        description: '旗舰店货架',
        position: 'C1',
        capacity: 200,
        currentOccupancy: 0,
        status: 'active',
      },
    ],
  });

  // 8. 获取创建的货架信息
  const createdShelves = await prisma.shelf.findMany({
    where: { storeId: mainStore.id },
  });

  // 9. 创建商品
  console.log('Creating products...');
  const products = [
    {
      shelfId: createdShelves[0].id,
      barcode: '6901234567890',
      name: '可口可乐',
      description: '330ml罐装可乐',
      category: '饮料',
      unit: '罐',
      price: 3.5,
      costPrice: 2.0,
      stock: 50,
      minThreshold: 10,
      maxThreshold: 100,
      images: ['https://example.com/coke.jpg'],
      status: 'active',
    },
    {
      shelfId: createdShelves[0].id,
      barcode: '6909876543210',
      name: '百事可乐',
      description: '330ml罐装百事',
      category: '饮料',
      unit: '罐',
      price: 3.0,
      costPrice: 1.8,
      stock: 30,
      minThreshold: 10,
      maxThreshold: 100,
      status: 'active',
    },
    {
      shelfId: createdShelves[1].id,
      barcode: '6923456789012',
      name: '奥利奥饼干',
      description: '巧克力夹心饼干',
      category: '零食',
      unit: '包',
      price: 8.5,
      costPrice: 5.0,
      stock: 20,
      minThreshold: 5,
      maxThreshold: 50,
      status: 'active',
    },
    {
      shelfId: createdShelves[1].id,
      barcode: '6934567890123',
      name: '薯片',
      description: '烧烤味薯片',
      category: '零食',
      unit: '包',
      price: 6.0,
      costPrice: 3.5,
      stock: 40,
      minThreshold: 10,
      maxThreshold: 80,
      status: 'active',
    },
    {
      shelfId: createdShelves[2].id,
      barcode: '6945678901234',
      name: '洗手液',
      description: '500ml杀菌洗手液',
      category: '日用品',
      unit: '瓶',
      price: 15.0,
      costPrice: 8.0,
      stock: 10,
      minThreshold: 5,
      maxThreshold: 30,
      status: 'active',
    },
  ];

  for (const productData of products) {
    await prisma.product.upsert({
      where: { barcode: productData.barcode },
      update: {},
      create: productData,
    });
  }

  // 10. 创建一些库存操作日志
  console.log('Creating stock logs...');
  const sampleProducts = await prisma.product.findMany({ take: 3 });
  
  for (const product of sampleProducts) {
    await prisma.log.create({
      data: {
        productId: product.id,
        operationType: 'IN',
        quantity: 50,
        previousStock: 0,
        newStock: 50,
        operatorId: storeOwner.id,
        remark: '初始入库',
      },
    });
  }

  // 11. 创建销售记录
  console.log('Creating sales records...');
  const cokeProduct = await prisma.product.findFirst({ where: { barcode: '6901234567890' } });
  if (cokeProduct) {
    await prisma.productSale.create({
      data: {
        productId: cokeProduct.id,
        quantity: 5,
        amount: 17.5,
        storeId: mainStore.id,
        saleDate: new Date('2024-01-15'),
      },
    });

    await prisma.productSale.create({
      data: {
        productId: cokeProduct.id,
        quantity: 3,
        amount: 10.5,
        storeId: mainStore.id,
        saleDate: new Date('2024-01-16'),
      },
    });
  }

  console.log('✅ Database seeding completed!');
  console.log(`📊 Created:`);
  console.log(`   - ${await prisma.user.count()} users`);
  console.log(`   - ${await prisma.store.count()} stores`);
  console.log(`   - ${await prisma.shelf.count()} shelves`);
  console.log(`   - ${await prisma.product.count()} products`);
  console.log(`   - ${await prisma.log.count()} stock logs`);
  console.log(`   - ${await prisma.productSale.count()} sales records`);
}

main()
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
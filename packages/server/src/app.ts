import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { sequelize } from './models/index';
import { errorHandler } from './middlewares/errorHandler';
import authRouter from './routes/auth';
import shopsRouter from './routes/shops';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/shops', shopsRouter);

// Unified error handler (must be last)
app.use(errorHandler);

const PORT = parseInt(process.env.PORT || '3000', 10);

async function start() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // sync({ force: false }) 只创建不存在的表，不修改已有表结构
    // 表结构变更请使用 init-db.sql 或迁移工具
    await sequelize.sync({ force: false });
    console.log('Models synchronized.');

    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();

export default app;

-- 智慧店铺数据库建表 SQL
-- 用于参考，实际使用 Sequelize sync 创建表结构

CREATE DATABASE IF NOT EXISTS smart_shop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE smart_shop;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id          INT          NOT NULL AUTO_INCREMENT,
  openid      VARCHAR(255) NOT NULL,
  nickname    VARCHAR(255) NOT NULL DEFAULT '',
  avatar_url  VARCHAR(255) NOT NULL DEFAULT '',
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_openid (openid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 店铺表
CREATE TABLE IF NOT EXISTS shops (
  id          INT          NOT NULL AUTO_INCREMENT,
  name        VARCHAR(255) NOT NULL,
  owner_id    INT          NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_shops_owner_id (owner_id),
  CONSTRAINT fk_shops_owner FOREIGN KEY (owner_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 店铺成员表
CREATE TABLE IF NOT EXISTS shop_members (
  id          INT                       NOT NULL AUTO_INCREMENT,
  shop_id     INT                       NOT NULL,
  user_id     INT                       NOT NULL,
  role        ENUM('owner','operator')  NOT NULL,
  created_at  DATETIME                  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_shop_members_shop_user (shop_id, user_id),
  CONSTRAINT fk_shop_members_shop FOREIGN KEY (shop_id) REFERENCES shops (id),
  CONSTRAINT fk_shop_members_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 商品表
CREATE TABLE IF NOT EXISTS products (
  id               INT          NOT NULL AUTO_INCREMENT,
  shop_id          INT          NOT NULL,
  name             VARCHAR(255) NOT NULL,
  code             VARCHAR(255) NOT NULL,
  category         VARCHAR(255) NOT NULL DEFAULT '',
  spec             VARCHAR(255) NOT NULL DEFAULT '',
  unit             VARCHAR(255) NOT NULL DEFAULT '',
  alert_threshold  INT          NOT NULL DEFAULT 0,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_products_shop_code (shop_id, code),
  CONSTRAINT fk_products_shop FOREIGN KEY (shop_id) REFERENCES shops (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 库存表
CREATE TABLE IF NOT EXISTS inventory (
  id          INT      NOT NULL AUTO_INCREMENT,
  shop_id     INT      NOT NULL,
  product_id  INT      NOT NULL,
  quantity    INT      NOT NULL DEFAULT 0,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_inventory_shop_product (shop_id, product_id),
  CONSTRAINT fk_inventory_shop    FOREIGN KEY (shop_id)    REFERENCES shops    (id),
  CONSTRAINT fk_inventory_product FOREIGN KEY (product_id) REFERENCES products (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 出入库记录表
CREATE TABLE IF NOT EXISTS stock_records (
  id               INT                  NOT NULL AUTO_INCREMENT,
  shop_id          INT                  NOT NULL,
  product_id       INT                  NOT NULL,
  operator_id      INT                  NOT NULL,
  type             ENUM('in','out')     NOT NULL,
  quantity         INT                  NOT NULL,
  quantity_before  INT                  NOT NULL,
  quantity_after   INT                  NOT NULL,
  remark           VARCHAR(255)         NULL,
  created_at       DATETIME             NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_stock_records_shop_id     (shop_id),
  KEY idx_stock_records_product_id  (product_id),
  KEY idx_stock_records_operator_id (operator_id),
  KEY idx_stock_records_created_at  (created_at),
  CONSTRAINT fk_stock_records_shop     FOREIGN KEY (shop_id)     REFERENCES shops    (id),
  CONSTRAINT fk_stock_records_product  FOREIGN KEY (product_id)  REFERENCES products (id),
  CONSTRAINT fk_stock_records_operator FOREIGN KEY (operator_id) REFERENCES users    (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

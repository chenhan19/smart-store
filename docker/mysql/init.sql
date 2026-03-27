-- 创建数据库用户并授权
CREATE USER IF NOT EXISTS 'smartstore'@'%' IDENTIFIED BY 'smartstore123';
GRANT ALL PRIVILEGES ON smart_store.* TO 'smartstore'@'%';
FLUSH PRIVILEGES;

-- 设置时区
SET TIME_ZONE = '+08:00';
#!/bin/bash

# 智慧店铺管理系统 - 部署脚本
# 用法: ./deploy.sh [环境] [操作]
# 例如: ./deploy.sh prod up

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 环境变量文件
ENV_FILE=".env"
PROD_ENV_FILE=".env.production"

# 显示帮助
show_help() {
    echo -e "${BLUE}智慧店铺管理系统部署脚本${NC}"
    echo ""
    echo "用法: $0 [环境] [操作]"
    echo ""
    echo "环境:"
    echo "  dev     开发环境"
    echo "  prod    生产环境"
    echo ""
    echo "操作:"
    echo "  up       启动所有服务"
    echo "  down     停止所有服务"
    echo "  restart  重启服务"
    echo "  logs     查看日志"
    echo "  stop     停止服务"
    echo "  ps       查看服务状态"
    echo "  build    构建镜像"
    echo "  pull     拉取最新代码"
    echo "  deploy   完整部署（拉取代码 -> 构建 -> 启动）"
    echo ""
    echo "示例:"
    echo "  $0 dev up          # 启动开发环境"
    echo "  $0 prod deploy     # 部署生产环境"
    echo "  $0 prod logs       # 查看生产环境日志"
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}错误: 未安装 $1${NC}"
        exit 1
    fi
}

# 检查Docker和Docker Compose
check_docker() {
    check_command docker
    check_command docker-compose
    echo -e "${GREEN}✓ Docker和Docker Compose已安装${NC}"
}

# 检查环境文件
check_env_files() {
    local env=$1
    
    if [[ "$env" == "prod" && ! -f "$PROD_ENV_FILE" ]]; then
        echo -e "${YELLOW}警告: 未找到生产环境配置文件 $PROD_ENV_FILE${NC}"
        echo -e "请从 $ENV_FILE.example 创建或复制:"
        echo -e "  cp .env.example $PROD_ENV_FILE"
        echo -e "然后编辑 $PROD_ENV_FILE 设置生产环境变量"
        exit 1
    fi
    
    echo -e "${GREEN}✓ 环境文件检查通过${NC}"
}

# 获取Docker Compose文件
get_compose_file() {
    local env=$1
    
    case $env in
        dev)
            echo "docker-compose.yml"
            ;;
        prod)
            echo "docker-compose.prod.yml"
            ;;
        *)
            echo -e "${RED}错误: 未知环境 '$env'${NC}"
            exit 1
            ;;
    esac
}

# 获取环境文件
get_env_file() {
    local env=$1
    
    case $env in
        dev)
            echo "$ENV_FILE"
            ;;
        prod)
            echo "$PROD_ENV_FILE"
            ;;
        *)
            echo -e "${RED}错误: 未知环境 '$env'${NC}"
            exit 1
            ;;
    esac
}

# 开发环境操作
dev_up() {
    echo -e "${BLUE}启动开发环境...${NC}"
    docker-compose -f $(get_compose_file dev) up -d
    echo -e "${GREEN}✓ 开发环境已启动${NC}"
    echo ""
    echo "访问以下服务:"
    echo "  - API服务: http://localhost:3000"
    echo "  - 数据库管理: http://localhost:8081"
    echo "  - Redis监控: redis-cli -h localhost -p 6379"
}

# 生产环境操作
prod_up() {
    echo -e "${BLUE}启动生产环境...${NC}"
    docker-compose -f $(get_compose_file prod) --env-file $(get_env_file prod) up -d
    echo -e "${GREEN}✓ 生产环境已启动${NC}"
}

# 通用停止操作
compose_down() {
    local env=$1
    echo -e "${YELLOW}停止 $env 环境...${NC}"
    docker-compose -f $(get_compose_file $env) --env-file $(get_env_file $env) down
    echo -e "${GREEN}✓ $env 环境已停止${NC}"
}

# 重启服务
compose_restart() {
    local env=$1
    echo -e "${BLUE}重启 $env 环境...${NC}"
    docker-compose -f $(get_compose_file $env) --env-file $(get_env_file $env) restart
    echo -e "${GREEN}✓ $env 环境已重启${NC}"
}

# 查看日志
compose_logs() {
    local env=$1
    echo -e "${BLUE}查看 $env 环境日志...${NC}"
    docker-compose -f $(get_compose_file $env) --env-file $(get_env_file $env) logs -f --tail=100
}

# 停止服务
compose_stop() {
    local env=$1
    echo -e "${YELLOW}停止 $env 环境服务...${NC}"
    docker-compose -f $(get_compose_file $env) --env-file $(get_env_file $env) stop
    echo -e "${GREEN}✓ $env 环境服务已停止${NC}"
}

# 查看服务状态
compose_ps() {
    local env=$1
    echo -e "${BLUE}$env 环境服务状态:${NC}"
    docker-compose -f $(get_compose_file $env) --env-file $(get_env_file $env) ps
}

# 构建镜像
compose_build() {
    local env=$1
    echo -e "${BLUE}构建 $env 环境镜像...${NC}"
    docker-compose -f $(get_compose_file $env) --env-file $(get_env_file $env) build --no-cache
    echo -e "${GREEN}✓ $env 环境镜像构建完成${NC}"
}

# 拉取最新代码
git_pull() {
    echo -e "${BLUE}拉取最新代码...${NC}"
    git pull origin main
    echo -e "${GREEN}✓ 代码拉取完成${NC}"
}

# 完整部署流程
full_deploy() {
    local env=$1
    
    echo -e "${BLUE}开始 $env 环境完整部署${NC}"
    echo "======================================"
    
    # 1. 拉取代码
    git_pull
    
    # 2. 构建镜像
    compose_build $env
    
    # 3. 停止旧服务
    compose_down $env
    
    # 4. 启动新服务
    if [[ "$env" == "dev" ]]; then
        dev_up
    else
        prod_up
    fi
    
    # 5. 检查服务状态
    sleep 5
    compose_ps $env
    
    echo "======================================"
    echo -e "${GREEN}✓ $env 环境部署完成${NC}"
}

# 主函数
main() {
    if [[ $# -lt 2 ]]; then
        show_help
        exit 1
    fi
    
    local env=$1
    local action=$2
    
    # 检查环境
    check_docker
    check_env_files $env
    
    # 执行操作
    case $action in
        up)
            if [[ "$env" == "dev" ]]; then
                dev_up
            else
                prod_up
            fi
            ;;
        down)
            compose_down $env
            ;;
        restart)
            compose_restart $env
            ;;
        logs)
            compose_logs $env
            ;;
        stop)
            compose_stop $env
            ;;
        ps)
            compose_ps $env
            ;;
        build)
            compose_build $env
            ;;
        pull)
            git_pull
            ;;
        deploy)
            full_deploy $env
            ;;
        *)
            echo -e "${RED}错误: 未知操作 '$action'${NC}"
            show_help
            exit 1
            ;;
    esac
}

# 运行主函数
main "$@"
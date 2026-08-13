#!/usr/bin/env bash
set -e

# ============================================================
# EasyDetek 文档站点 —— 一键部署脚本
# 在服务器上运行此脚本即可完成全部部署
# ============================================================

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${CYAN}[INFO]${NC}  $1"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
fail()  { echo -e "${RED}[FAIL]${NC}  $1"; exit 1; }

# ---------- 配置 ----------
DEPLOY_DIR="${1:-/home/easydetek/site}"
REPO_URL="https://github.com/easydetek/easydetek.github.io.git"
GITEE_URL="https://gitee.com/easydetek/easydetek.gitee.io.git"
DOMAIN="docs.easydetek.com"

echo ""
echo "========================================"
echo "  EasyDetek 文档站点一键部署"
echo "========================================"
echo "  部署目录: $DEPLOY_DIR"
echo "  域名:     $DOMAIN"
echo "========================================"
echo ""

# ---------- 1. 检查 root 权限 ----------
if [ "$EUID" -ne 0 ]; then
  warn "建议用 root 用户运行（或加 sudo）"
  read -p "继续？(y/N) " -n 1 -r
  echo
  [[ ! $REPLY =~ ^[Yy]$ ]] && exit 1
fi

# ---------- 2. 安装 Docker ----------
if ! command -v docker &> /dev/null; then
  info "安装 Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
  ok "Docker 已安装"
else
  ok "Docker 已存在: $(docker --version)"
fi

if ! docker compose version &> /dev/null; then
  info "安装 Docker Compose 插件..."
  apt-get update -qq && apt-get install -y -qq docker-compose-plugin 2>/dev/null || \
  yum install -y docker-compose-plugin 2>/dev/null || true
fi
ok "Docker Compose: $(docker compose version --short)"

# ---------- 3. 克隆代码 ----------
if [ -d "$DEPLOY_DIR/.git" ]; then
  info "目录已存在，拉取最新代码..."
  cd "$DEPLOY_DIR"
  git pull origin main || warn "Git pull 失败，使用现有代码继续"
else
  info "克隆代码到 $DEPLOY_DIR ..."
  mkdir -p "$(dirname "$DEPLOY_DIR")"
  git clone "$REPO_URL" "$DEPLOY_DIR" || {
    warn "GitHub 克隆失败，尝试 Gitee（国内）..."
    git clone "$GITEE_URL" "$DEPLOY_DIR"
  }
  cd "$DEPLOY_DIR"
fi
ok "代码就绪"

# ---------- 4. 检查 .env ----------
if [ ! -f ".env" ]; then
  info "创建 .env 文件（OAuth 密钥）..."
  if [ -f ".env.example" ]; then
    cp .env.example .env
    warn ".env 已从模板创建，请编辑填入真实 OAuth 密钥！"
    warn "命令: nano $DEPLOY_DIR/.env"
  else
    fail ".env.example 不存在，请检查代码完整性"
  fi
else
  ok ".env 已存在"
fi

# ---------- 5. 检查端口 ----------
for port in 80 443; do
  if ss -tlnp | grep ":$port " &> /dev/null; then
    warn "端口 $port 已被占用，可能需要停止占用程序"
    warn "查看: ss -tlnp | grep :$port"
    read -p "忽略并继续？(y/N) " -n 1 -r
    echo
    [[ ! $REPLY =~ ^[Yy]$ ]] && fail "请先释放端口 $port"
  fi
done
ok "端口 80/443 可用"

# ---------- 6. 构建并启动 ----------
info "构建并启动全部服务（站点 + Caddy HTTPS + OAuth 代理）..."
info "首次构建约需 5-10 分钟，请耐心等待..."
echo ""

docker compose up -d --build

echo ""
info "等待服务启动..."
sleep 10

# ---------- 7. 验证 ----------
echo ""
echo "========================================"
echo "  部署状态检查"
echo "========================================"

# 容器状态
echo ""
info "容器状态:"
docker compose ps --format "table {{.Name}}\t{{.Status}}" 2>/dev/null || docker compose ps

# HTTPS 检查
echo ""
info "HTTPS 证书:"
if curl -sk "https://$DOMAIN/" -o /dev/null -w "%{http_code}" 2>/dev/null | grep -q "200"; then
  ok "https://$DOMAIN → 200 ✅"
else
  warn "https://$DOMAIN 暂未就绪（Caddy 可能还在申请证书，请等 1-2 分钟后重试）"
  warn "手动检查: curl -k https://$DOMAIN/"
fi

# CMS 后台
echo ""
info "CMS 管理后台:"
if curl -sk "https://$DOMAIN/admin/" -o /dev/null -w "%{http_code}" 2>/dev/null | grep -q "200"; then
  ok "https://$DOMAIN/admin/ → 200 ✅"
  ok "文档人员登录地址: https://$DOMAIN/admin/"
else
  warn "CMS 后台暂未就绪，请稍后重试"
fi

# ---------- 8. 完成 ----------
echo ""
echo "========================================"
echo -e "${GREEN}  部署完成！${NC}"
echo "========================================"
echo ""
echo "  站点地址:   https://$DOMAIN"
echo "  管理后台:   https://$DOMAIN/admin/"
echo "  部署目录:   $DEPLOY_DIR"
echo ""
echo "  常用命令:"
echo "    cd $DEPLOY_DIR"
echo "    docker compose logs -f          # 查看日志"
echo "    docker compose restart          # 重启"
echo "    docker compose down             # 停止"
echo "    docker compose up -d --build    # 更新重建"
echo ""
echo "  更新文档:"
echo "    cd $DEPLOY_DIR && git pull && docker compose up -d --build"
echo ""

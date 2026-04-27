#!/bin/bash
# =============================================================
# deploy_setup.sh
# Configuración inicial del servidor Ubuntu 24.04
# Ejecutar como root o con sudo
# =============================================================

set -e  # detener en cualquier error

APP_DIR="/var/www/cmms"
APP_USER="www-data"
PYTHON_ENV="$APP_DIR/venv"

echo "=== [1/6] Actualizando sistema ==="
apt-get update && apt-get upgrade -y

echo "=== [2/6] Instalando dependencias del sistema ==="
apt-get install -y \
    python3 python3-pip python3-venv \
    postgresql postgresql-contrib \
    nginx \
    git \
    curl \
    libpq-dev python3-dev

echo "=== [3/6] Creando base de datos PostgreSQL ==="
sudo -u postgres psql <<EOF
CREATE DATABASE cmms_db;
CREATE USER cmms_user WITH ENCRYPTED PASSWORD 'CAMBIAR_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE cmms_db TO cmms_user;
\c cmms_db
GRANT ALL ON SCHEMA public TO cmms_user;
EOF

echo "=== [4/6] Creando estructura de directorios ==="
mkdir -p $APP_DIR/{uploads,logs}
chown -R $APP_USER:$APP_USER $APP_DIR

echo "=== [5/6] Creando servicio systemd para Gunicorn ==="
cat > /etc/systemd/system/cmms.service <<EOF
[Unit]
Description=CMMS IMCLA-Volcán - Gunicorn
After=network.target postgresql.service

[Service]
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$APP_DIR/backend
Environment="PATH=$PYTHON_ENV/bin"
EnvironmentFile=$APP_DIR/backend/.env
ExecStart=$PYTHON_ENV/bin/gunicorn app.main:app \
    --workers 3 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind unix:$APP_DIR/cmms.sock \
    --access-logfile $APP_DIR/logs/access.log \
    --error-logfile $APP_DIR/logs/error.log \
    --timeout 120

Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

echo "=== [6/6] Configurando Nginx ==="
cat > /etc/nginx/sites-available/cmms <<EOF
server {
    listen 80;
    server_name _;  # Cambiar por tu dominio o IP

    # Frontend (React build)
    location / {
        root $APP_DIR/frontend/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    # API Backend
    location /api/ {
        proxy_pass http://unix:$APP_DIR/cmms.sock;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_read_timeout 120s;
    }

    # Archivos subidos
    location /uploads/ {
        alias $APP_DIR/uploads/;
        expires 30d;
    }

    client_max_body_size 20M;
}
EOF

ln -sf /etc/nginx/sites-available/cmms /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

systemctl daemon-reload
systemctl enable cmms

echo ""
echo "==================================================="
echo "✓ Setup completado."
echo ""
echo "Próximos pasos:"
echo "  1. Clonar el repo: git clone https://github.com/TU_USUARIO/cmms-imcla-volcan $APP_DIR"
echo "  2. Crear el .env:  cp $APP_DIR/backend/.env.example $APP_DIR/backend/.env"
echo "  3. Editar .env con las credenciales reales"
echo "  4. Instalar deps:  python3 -m venv $PYTHON_ENV"
echo "                     $PYTHON_ENV/bin/pip install -r $APP_DIR/backend/requirements.txt"
echo "  5. Aplicar schema: psql -U cmms_user -d cmms_db < $APP_DIR/database/cmms_schema.sql"
echo "  6. Iniciar:        systemctl start cmms"
echo "==================================================="

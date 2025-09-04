# 🚀 KidsStream - Hướng dẫn Triển khai

## 📋 Tổng quan

KidsStream là nền tảng video streaming an toàn cho trẻ em với các tính năng:
- ✅ Hệ thống comment với phản hồi lồng nhau
- ✅ Hỗ trợ video local và YouTube
- ✅ Kiểm duyệt nội dung tự động
- ✅ Phân quyền người dùng (Parent/Child)
- ✅ Giao diện thân thiện với trẻ em

## 🏗️ Kiến trúc Hệ thống

### Backend (Python/FastAPI)
```
backend/
├── main.py              # API endpoints chính
├── models.py            # Database models (SQLAlchemy)
├── schemas.py           # Pydantic schemas
├── auth.py              # JWT authentication
├── database.py          # Database configuration
├── video_processing.py  # FFmpeg video processing
├── content_moderation.py # AI content moderation
├── youtube_utils.py     # YouTube API utilities
├── init_db.py          # Database initialization
└── requirements.txt    # Python dependencies
```

### Frontend (React.js)
```
frontend/src/
├── components/
│   ├── Navbar.js        # Navigation bar
│   ├── VideoCard.js     # Video display card
│   ├── Comments.js      # Comment system
│   ├── YouTubeUpload.js # YouTube video form
│   └── ProtectedRoute.js # Route protection
├── pages/
│   ├── Home.js          # Homepage with video grid
│   ├── VideoPlayer.js   # Video player page
│   ├── Upload.js        # Upload page with tabs
│   ├── Login.js         # Login form
│   ├── Register.js      # Registration form
│   └── Profile.js       # User profile
├── contexts/
│   └── AuthContext.js   # Authentication context
└── App.js              # Main application
```

### Database Schema
```sql
-- Users table
users (
    id, email, username, hashed_password, 
    is_parent, is_active, created_at
)

-- Videos table  
videos (
    id, title, description, filename, file_path,
    youtube_url, video_type, thumbnail_path,
    duration, file_size, age_rating, is_approved,
    view_count, created_at, updated_at,
    category_id, uploader_id
)

-- Comments table
comments (
    id, content, created_at, updated_at,
    is_approved, video_id, user_id, parent_id
)

-- Categories, WatchHistory, ContentReport tables
```

## 🐳 Triển khai với Docker

### 1. Yêu cầu hệ thống
- Docker & Docker Compose
- 4GB RAM tối thiểu
- 20GB dung lượng đĩa

### 2. Cài đặt nhanh
```bash
# Clone repository
git clone <repository-url>
cd kidsstream

# Khởi động tất cả services
docker-compose up -d

# Khởi tạo database
docker-compose exec backend python init_db.py

# Kiểm tra logs
docker-compose logs -f
```

### 3. Truy cập ứng dụng
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## 🛠️ Triển khai Development

### Backend Setup
```bash
cd backend

# Tạo virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Cài đặt dependencies
pip install -r requirements.txt

# Tạo file .env
cp .env.example .env
# Cập nhật DATABASE_URL và SECRET_KEY

# Khởi tạo database
python init_db.py

# Chạy development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup
```bash
cd frontend

# Cài đặt dependencies
npm install

# Tạo file .env.local
echo "REACT_APP_API_URL=http://localhost:8000" > .env.local

# Chạy development server
npm start
```

### Database Setup
```bash
# PostgreSQL với Docker
docker run -d \
  --name kidsstream-db \
  -e POSTGRES_DB=kidsstream_db \
  -e POSTGRES_USER=kidsstream \
  -e POSTGRES_PASSWORD=kidsstream123 \
  -p 5432:5432 \
  postgres:15

# Redis với Docker
docker run -d \
  --name kidsstream-redis \
  -p 6379:6379 \
  redis:7-alpine
```

## 🌐 Triển khai Production

### 1. Chuẩn bị môi trường
```bash
# Cập nhật hệ thống
sudo apt update && sudo apt upgrade -y

# Cài đặt Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Cài đặt Docker Compose
sudo apt install docker-compose-plugin
```

### 2. Cấu hình production
```bash
# Tạo thư mục ứng dụng
sudo mkdir -p /opt/kidsstream
cd /opt/kidsstream

# Clone code
git clone <repository-url> .

# Tạo production env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Cập nhật cấu hình production
nano backend/.env
```

### 3. Environment Variables cho Production
```env
# backend/.env
DATABASE_URL=postgresql://kidsstream:STRONG_PASSWORD@db:5432/kidsstream_db
SECRET_KEY=your-very-long-secret-key-minimum-32-characters
REDIS_URL=redis://redis:6379/0

# SSL/Domain
DOMAIN=your-domain.com
SSL_EMAIL=your-email@domain.com

# File Storage (Optional)
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_S3_BUCKET=your-bucket-name
```

### 4. SSL/HTTPS với Let's Encrypt
```bash
# Cài đặt Certbot
sudo apt install certbot python3-certbot-nginx

# Tạo SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto renewal
sudo crontab -e
# Thêm dòng: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 5. Nginx Configuration
```nginx
# /etc/nginx/sites-available/kidsstream
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Video streaming
    location /videos/ {
        proxy_pass http://localhost:8000/videos/;
        proxy_buffering off;
        proxy_cache off;
    }
}
```

### 6. Khởi động Production
```bash
# Build và khởi động services
docker-compose -f docker-compose.prod.yml up -d

# Khởi tạo database
docker-compose exec backend python init_db.py

# Kiểm tra status
docker-compose ps
```

## 📊 Monitoring & Maintenance

### Health Checks
```bash
# Kiểm tra services
docker-compose ps
curl http://localhost:8000/health
curl http://localhost:3000

# Kiểm tra logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### Backup Database
```bash
# Backup
docker-compose exec db pg_dump -U kidsstream kidsstream_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
docker-compose exec -T db psql -U kidsstream kidsstream_db < backup.sql
```

### Performance Monitoring
```bash
# Resource usage
docker stats

# Database performance
docker-compose exec db psql -U kidsstream -d kidsstream_db -c "SELECT * FROM pg_stat_activity;"

# Disk usage
du -sh /var/lib/docker/volumes/
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Database Connection Error
```bash
# Kiểm tra database container
docker-compose logs db

# Restart database
docker-compose restart db

# Kiểm tra connection
docker-compose exec backend python -c "from database import engine; print(engine.connect())"
```

#### 2. Video Upload Issues
```bash
# Kiểm tra file permissions
ls -la uploads/ processed/ thumbnails/

# Kiểm tra FFmpeg
docker-compose exec backend ffmpeg -version

# Kiểm tra disk space
df -h
```

#### 3. YouTube Integration Issues
```bash
# Test YouTube API
docker-compose exec backend python -c "
from youtube_utils import get_youtube_video_info
print(get_youtube_video_info('dQw4w9WgXcQ'))
"

# Kiểm tra network connectivity
docker-compose exec backend ping youtube.com
```

#### 4. Frontend Build Issues
```bash
# Xóa node_modules và rebuild
rm -rf frontend/node_modules frontend/package-lock.json
docker-compose exec frontend npm install

# Kiểm tra environment variables
docker-compose exec frontend env | grep REACT_APP
```

## 🚀 Performance Optimization

### 1. Database Optimization
```sql
-- Tạo indexes
CREATE INDEX idx_videos_category ON videos(category_id);
CREATE INDEX idx_videos_uploader ON videos(uploader_id);
CREATE INDEX idx_comments_video ON comments(video_id);
CREATE INDEX idx_comments_user ON comments(user_id);

-- Analyze tables
ANALYZE videos;
ANALYZE comments;
ANALYZE users;
```

### 2. Redis Caching
```python
# Cache video metadata
CACHE_TTL = 3600  # 1 hour

# Cache popular videos
redis_client.setex(f"popular_videos", CACHE_TTL, json.dumps(videos))

# Cache user sessions
redis_client.setex(f"user_session:{user_id}", CACHE_TTL, session_data)
```

### 3. CDN Setup (Optional)
```bash
# AWS CloudFront
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json

# Configure S3 for video storage
aws s3 mb s3://your-video-bucket
aws s3api put-bucket-policy --bucket your-video-bucket --policy file://bucket-policy.json
```

## 📈 Scaling Considerations

### Horizontal Scaling
- **Load Balancer**: Nginx/HAProxy
- **Multiple Backend Instances**: Docker Swarm/Kubernetes
- **Database Replication**: PostgreSQL Read Replicas
- **Redis Cluster**: Multiple Redis instances

### Vertical Scaling
- **CPU**: Video processing requires high CPU
- **RAM**: Database caching và video processing
- **Storage**: SSD cho database, HDD cho video files
- **Network**: High bandwidth cho video streaming

## 🔐 Security Best Practices

### 1. Authentication & Authorization
```python
# Strong password policy
PASSWORD_MIN_LENGTH = 8
PASSWORD_REQUIRE_SPECIAL = True

# JWT token expiration
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Rate limiting
RATE_LIMIT_PER_MINUTE = 100
```

### 2. Content Security
```python
# File upload restrictions
ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.avi', '.mov', '.mkv']
MAX_FILE_SIZE = 500 * 1024 * 1024  # 500MB

# Content moderation
ENABLE_AUTO_MODERATION = True
REQUIRE_MANUAL_APPROVAL = True
```

### 3. Network Security
```bash
# Firewall rules
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw deny 5432/tcp   # PostgreSQL (internal only)
sudo ufw deny 6379/tcp   # Redis (internal only)
sudo ufw enable
```

## 📞 Support & Maintenance

### Regular Tasks
- **Daily**: Backup database, check logs
- **Weekly**: Update dependencies, security patches  
- **Monthly**: Performance review, cleanup old files
- **Quarterly**: Security audit, disaster recovery test

### Contact Information
- **Technical Support**: tech-support@kidsstream.com
- **Security Issues**: security@kidsstream.com
- **General Inquiries**: info@kidsstream.com

---

📝 **Lưu ý**: Document này được cập nhật thường xuyên. Vui lòng kiểm tra version mới nhất trên repository.
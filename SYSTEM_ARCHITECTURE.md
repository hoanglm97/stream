# 🏗️ KidsStream - System Architecture

## 📋 Tổng quan Kiến trúc

KidsStream được thiết kế theo mô hình **3-tier architecture** với các lớp rõ ràng và khả năng mở rộng cao.

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   React.js  │  │ Mobile App  │  │   Admin     │         │
│  │  Frontend   │  │  (Future)   │  │   Panel     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  FastAPI    │  │   Redis     │  │   Nginx     │         │
│  │   Server    │  │   Cache     │  │ Load Balancer│        │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     DATA LAYER                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ PostgreSQL  │  │ File System │  │  YouTube    │         │
│  │  Database   │  │   Storage   │  │    API      │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Core Components

### 1. Frontend Layer (React.js)

```mermaid
graph TD
    A[React App] --> B[Components]
    A --> C[Pages]
    A --> D[Contexts]
    
    B --> B1[Navbar]
    B --> B2[VideoCard]
    B --> B3[Comments]
    B --> B4[YouTubeUpload]
    
    C --> C1[Home]
    C --> C2[VideoPlayer]
    C --> C3[Upload]
    C --> C4[Profile]
    
    D --> D1[AuthContext]
    D --> D2[VideoContext]
```

**Responsibilities:**
- User interface rendering
- State management (React Context)
- API communication
- Client-side routing
- Real-time updates

**Key Technologies:**
- React 18 with Hooks
- React Router for SPA routing
- Axios for HTTP requests
- Tailwind CSS for styling
- React Player for video playback

### 2. Backend Layer (FastAPI)

```mermaid
graph TD
    A[FastAPI App] --> B[Authentication]
    A --> C[Video Management]
    A --> D[Comment System]
    A --> E[Content Moderation]
    
    B --> B1[JWT Tokens]
    B --> B2[User Roles]
    
    C --> C1[File Upload]
    C --> C2[YouTube Integration]
    C --> C3[Video Processing]
    
    D --> D1[CRUD Operations]
    D --> D2[Nested Comments]
    
    E --> E1[Content Filtering]
    E --> E2[Auto Moderation]
```

**Responsibilities:**
- REST API endpoints
- Authentication & authorization
- Business logic processing
- Database operations
- File processing & storage
- External API integration

**Key Technologies:**
- FastAPI framework
- SQLAlchemy ORM
- Pydantic for data validation
- JWT for authentication
- FFmpeg for video processing

### 3. Database Layer (PostgreSQL)

```mermaid
erDiagram
    USERS {
        int id PK
        string email UK
        string username UK
        string hashed_password
        boolean is_parent
        boolean is_active
        datetime created_at
    }
    
    VIDEOS {
        int id PK
        string title
        text description
        string filename
        string file_path
        string youtube_url
        string video_type
        string thumbnail_path
        float duration
        int file_size
        string age_rating
        boolean is_approved
        int view_count
        datetime created_at
        datetime updated_at
        int category_id FK
        int uploader_id FK
    }
    
    COMMENTS {
        int id PK
        text content
        datetime created_at
        datetime updated_at
        boolean is_approved
        int video_id FK
        int user_id FK
        int parent_id FK
    }
    
    CATEGORIES {
        int id PK
        string name UK
        text description
        string color
        datetime created_at
    }
    
    WATCH_HISTORY {
        int id PK
        int user_id FK
        int video_id FK
        datetime watched_at
        float watch_duration
        boolean completed
    }
    
    CONTENT_REPORTS {
        int id PK
        int video_id FK
        int reporter_id FK
        string reason
        text description
        string status
        datetime created_at
        datetime resolved_at
    }
    
    USERS ||--o{ VIDEOS : uploads
    USERS ||--o{ COMMENTS : writes
    USERS ||--o{ WATCH_HISTORY : has
    USERS ||--o{ CONTENT_REPORTS : reports
    
    VIDEOS ||--o{ COMMENTS : has
    VIDEOS ||--o{ WATCH_HISTORY : tracked
    VIDEOS ||--o{ CONTENT_REPORTS : reported
    VIDEOS }o--|| CATEGORIES : belongs_to
    
    COMMENTS ||--o{ COMMENTS : replies_to
```

## 🔄 Data Flow Architecture

### 1. Video Upload Flow (Local Files)

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant DB as Database
    participant FS as File System
    participant FF as FFmpeg
    
    U->>F: Select video file
    F->>B: POST /videos/upload
    B->>B: Validate user permissions
    B->>FS: Save original file
    B->>FF: Process video (multiple qualities)
    B->>FF: Generate thumbnail
    B->>B: Content moderation check
    B->>DB: Save video metadata
    B->>F: Return video info
    F->>U: Show success message
```

### 2. YouTube Video Integration Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant Y as YouTube API
    participant DB as Database
    
    U->>F: Enter YouTube URL
    F->>B: POST /videos/youtube
    B->>B: Validate YouTube URL
    B->>Y: Get video info (oEmbed)
    B->>B: Content validation for kids
    B->>DB: Save video metadata
    B->>F: Return video info
    F->>U: Show success message
```

### 3. Comment System Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant DB as Database
    
    U->>F: Write comment
    F->>B: POST /videos/{id}/comments
    B->>B: Validate user auth
    B->>DB: Save comment
    B->>F: Return comment with user info
    F->>F: Update UI with new comment
    
    Note over F: For replies
    U->>F: Reply to comment
    F->>B: POST with parent_id
    B->>DB: Save reply with parent_id
    B->>F: Return nested comment structure
```

## 🚀 Deployment Architecture

### Development Environment

```mermaid
graph TB
    subgraph "Development (Docker Compose)"
        A[Frontend :3000] --> B[Backend :8000]
        B --> C[PostgreSQL :5432]
        B --> D[Redis :6379]
        B --> E[File System]
    end
    
    F[Developer] --> A
    G[YouTube API] --> B
```

### Production Environment

```mermaid
graph TB
    subgraph "Load Balancer"
        LB[Nginx/HAProxy]
    end
    
    subgraph "Application Tier"
        A1[Frontend Instance 1]
        A2[Frontend Instance 2]
        B1[Backend Instance 1]
        B2[Backend Instance 2]
        R[Redis Cluster]
    end
    
    subgraph "Data Tier"
        DB1[PostgreSQL Master]
        DB2[PostgreSQL Replica]
        S3[S3/File Storage]
    end
    
    subgraph "External Services"
        Y[YouTube API]
        CDN[CloudFront/CDN]
    end
    
    LB --> A1
    LB --> A2
    A1 --> B1
    A2 --> B2
    B1 --> DB1
    B2 --> DB2
    B1 --> R
    B2 --> R
    B1 --> S3
    B2 --> S3
    B1 --> Y
    B2 --> Y
    
    CDN --> S3
    Users --> LB
```

## 🔐 Security Architecture

### Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant DB as Database
    
    U->>F: Login credentials
    F->>B: POST /auth/login
    B->>DB: Verify user
    B->>B: Generate JWT token
    B->>F: Return JWT token
    F->>F: Store token in localStorage
    
    Note over F,B: For subsequent requests
    F->>B: API call with Authorization header
    B->>B: Validate JWT token
    B->>B: Check user permissions
    B->>F: Return response
```

### Authorization Matrix

| Resource | Child Account | Parent Account | Admin |
|----------|---------------|----------------|-------|
| View Videos | ✅ | ✅ | ✅ |
| Upload Videos | ❌ | ✅ | ✅ |
| Add YouTube Videos | ❌ | ✅ | ✅ |
| Comment | ✅ | ✅ | ✅ |
| Edit Own Comments | ✅ | ✅ | ✅ |
| Delete Any Comments | ❌ | ✅ | ✅ |
| Moderate Content | ❌ | ❌ | ✅ |

## 📊 Performance Architecture

### Caching Strategy

```mermaid
graph TD
    A[User Request] --> B{Cache Check}
    B -->|Hit| C[Return Cached Data]
    B -->|Miss| D[Database Query]
    D --> E[Update Cache]
    E --> F[Return Data]
    
    subgraph "Cache Layers"
        G[Redis - Session Data]
        H[Redis - Video Metadata]
        I[CDN - Static Assets]
        J[Browser Cache]
    end
```

**Cache TTL Settings:**
- User sessions: 30 minutes
- Video metadata: 1 hour
- Category list: 24 hours
- Static assets: 30 days

### Database Optimization

```sql
-- Performance Indexes
CREATE INDEX idx_videos_approved ON videos(is_approved);
CREATE INDEX idx_videos_category_rating ON videos(category_id, age_rating);
CREATE INDEX idx_comments_video_approved ON comments(video_id, is_approved);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_videos_created_at ON videos(created_at DESC);

-- Composite Indexes for common queries
CREATE INDEX idx_videos_search ON videos(is_approved, category_id, age_rating, created_at DESC);
```

## 🔄 Scalability Patterns

### Horizontal Scaling

```mermaid
graph TB
    subgraph "Auto Scaling Group"
        A1[App Instance 1]
        A2[App Instance 2]
        A3[App Instance N]
    end
    
    subgraph "Database Scaling"
        DB1[Primary DB]
        DB2[Read Replica 1]
        DB3[Read Replica 2]
    end
    
    subgraph "File Storage Scaling"
        S1[Storage Node 1]
        S2[Storage Node 2]
        S3[Storage Node N]
    end
    
    LB[Load Balancer] --> A1
    LB --> A2
    LB --> A3
    
    A1 --> DB1
    A2 --> DB2
    A3 --> DB3
    
    A1 --> S1
    A2 --> S2
    A3 --> S3
```

### Microservices Migration Path

```mermaid
graph TB
    subgraph "Current Monolith"
        M[FastAPI App]
    end
    
    subgraph "Future Microservices"
        U[User Service]
        V[Video Service]
        C[Comment Service]
        N[Notification Service]
        A[Auth Service]
    end
    
    M -.->|Migrate| U
    M -.->|Migrate| V
    M -.->|Migrate| C
    M -.->|Migrate| A
    
    G[API Gateway] --> U
    G --> V
    G --> C
    G --> N
    G --> A
```

## 📈 Monitoring & Observability

### Metrics Collection

```mermaid
graph TD
    A[Application Metrics] --> D[Prometheus]
    B[Infrastructure Metrics] --> D
    C[Custom Metrics] --> D
    
    D --> E[Grafana Dashboard]
    D --> F[AlertManager]
    
    G[Logs] --> H[ELK Stack]
    H --> I[Kibana Dashboard]
    
    J[Traces] --> K[Jaeger]
    K --> L[Distributed Tracing]
```

**Key Metrics:**
- Request rate & latency
- Error rate by endpoint
- Database connection pool
- Video processing queue
- Cache hit/miss ratio
- User engagement metrics

### Health Checks

```python
# Health check endpoints
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "version": "1.0.0"
    }

@app.get("/health/db")
async def db_health_check():
    # Check database connectivity
    pass

@app.get("/health/redis")
async def redis_health_check():
    # Check Redis connectivity
    pass
```

## 🔧 Configuration Management

### Environment-based Configuration

```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  backend:
    environment:
      - ENV=development
      - DEBUG=true
      - LOG_LEVEL=debug

# docker-compose.prod.yml
version: '3.8'
services:
  backend:
    environment:
      - ENV=production
      - DEBUG=false
      - LOG_LEVEL=info
```

### Feature Flags

```python
# Feature flag configuration
FEATURE_FLAGS = {
    "ENABLE_YOUTUBE_INTEGRATION": True,
    "ENABLE_AUTO_MODERATION": True,
    "ENABLE_COMMENTS": True,
    "ENABLE_LIVE_STREAMING": False,  # Future feature
    "MAX_VIDEO_SIZE_MB": 500,
    "MAX_COMMENT_LENGTH": 1000
}
```

## 🚨 Error Handling & Recovery

### Circuit Breaker Pattern

```python
from circuitbreaker import circuit

@circuit(failure_threshold=5, recovery_timeout=30)
def call_youtube_api(video_url):
    # YouTube API call with circuit breaker
    pass
```

### Graceful Degradation

```mermaid
graph TD
    A[User Request] --> B{YouTube API Available?}
    B -->|Yes| C[Full Feature]
    B -->|No| D[Degraded Mode]
    
    D --> E[Local Videos Only]
    D --> F[Cached Thumbnails]
    D --> G[Basic Functionality]
```

## 📱 Future Architecture Considerations

### Mobile App Integration

```mermaid
graph TD
    A[Mobile App] --> B[API Gateway]
    C[Web App] --> B
    D[Admin Panel] --> B
    
    B --> E[Auth Service]
    B --> F[Video Service]
    B --> G[Comment Service]
    
    H[Push Notifications] --> A
    I[Offline Sync] --> A
```

### Real-time Features

```mermaid
graph TD
    A[WebSocket Gateway] --> B[Comment Updates]
    A --> C[Live Chat]
    A --> D[View Count Updates]
    
    E[Message Queue] --> A
    F[Backend Services] --> E
```

---

📝 **Lưu ý**: Kiến trúc này được thiết kế để có thể mở rộng và thích ứng với sự phát triển của ứng dụng. Các component có thể được tách riêng thành microservices khi cần thiết.
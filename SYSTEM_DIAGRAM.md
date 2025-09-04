# 🏗️ KidsStream - System Architecture Diagram

## 📊 High-Level System Overview

```mermaid
graph TB
    subgraph "User Layer"
        U1[Children Users]
        U2[Parent Users]
        U3[Admin Users]
    end
    
    subgraph "Frontend Layer"
        WEB[React.js Web App]
        MOB[Mobile App<br/>(Future)]
    end
    
    subgraph "API Gateway"
        LB[Nginx Load Balancer]
        SSL[SSL Termination]
    end
    
    subgraph "Application Layer"
        API1[FastAPI Instance 1]
        API2[FastAPI Instance 2]
        CACHE[Redis Cache]
    end
    
    subgraph "Data Layer"
        DB[(PostgreSQL Database)]
        FILES[File System Storage]
        LOGS[(Log Storage)]
    end
    
    subgraph "External Services"
        YT[YouTube API]
        CDN[CDN/S3 Storage]
        SMTP[Email Service]
    end
    
    U1 --> WEB
    U2 --> WEB
    U3 --> WEB
    U1 --> MOB
    U2 --> MOB
    
    WEB --> SSL
    MOB --> SSL
    SSL --> LB
    
    LB --> API1
    LB --> API2
    
    API1 --> DB
    API1 --> CACHE
    API1 --> FILES
    API1 --> YT
    API1 --> CDN
    API1 --> SMTP
    
    API2 --> DB
    API2 --> CACHE
    API2 --> FILES
    API2 --> YT
    API2 --> CDN
    API2 --> SMTP
    
    API1 --> LOGS
    API2 --> LOGS
```

## 🔄 Data Flow Architecture

### 1. User Authentication Flow
```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API Server
    participant DB as Database
    participant C as Cache
    
    U->>F: Login Request
    F->>A: POST /auth/login
    A->>DB: Verify Credentials
    DB-->>A: User Data
    A->>A: Generate JWT Token
    A->>C: Store Session
    A-->>F: JWT Token
    F->>F: Store Token
    F-->>U: Login Success
```

### 2. Video Upload & Processing Flow
```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API Server
    participant FS as File System
    participant FF as FFmpeg
    participant DB as Database
    participant CM as Content Moderator
    
    U->>F: Upload Video File
    F->>A: POST /videos/upload
    A->>A: Validate User Permissions
    A->>FS: Save Original File
    A->>FF: Process Video (Multiple Qualities)
    FF-->>A: Processed Files
    A->>FF: Generate Thumbnail
    FF-->>A: Thumbnail File
    A->>CM: Content Moderation Check
    CM-->>A: Moderation Result
    A->>DB: Save Video Metadata
    A-->>F: Video Info
    F-->>U: Upload Success
```

### 3. YouTube Video Integration Flow
```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API Server
    participant YT as YouTube API
    participant DB as Database
    participant CM as Content Moderator
    
    U->>F: Enter YouTube URL
    F->>A: POST /videos/youtube
    A->>A: Validate YouTube URL
    A->>YT: Get Video Info (oEmbed)
    YT-->>A: Video Metadata
    A->>CM: Content Safety Check
    CM-->>A: Safety Result
    A->>DB: Save Video Metadata
    A-->>F: Video Info
    F-->>U: YouTube Video Added
```

### 4. Comment System Flow
```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API Server
    participant DB as Database
    participant C as Cache
    
    Note over U,C: Load Comments
    U->>F: View Video Page
    F->>A: GET /videos/{id}/comments
    A->>C: Check Cache
    alt Cache Hit
        C-->>A: Cached Comments
    else Cache Miss
        A->>DB: Query Comments
        DB-->>A: Comment Data
        A->>C: Update Cache
    end
    A-->>F: Comments with Replies
    F-->>U: Display Comments
    
    Note over U,C: Post Comment
    U->>F: Write Comment
    F->>A: POST /videos/{id}/comments
    A->>DB: Save Comment
    A->>C: Invalidate Cache
    A-->>F: New Comment
    F-->>U: Comment Posted
```

## 🗄️ Database Schema Diagram

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
    
    CATEGORIES {
        int id PK
        string name UK
        text description
        string color
        datetime created_at
    }
    
    VIDEOS {
        int id PK
        string title
        text description
        string filename "nullable for YouTube"
        string file_path "nullable for YouTube"
        string youtube_url "nullable for local"
        string video_type "local or youtube"
        string thumbnail_path
        float duration
        int file_size "nullable for YouTube"
        string age_rating "G, PG, PG-13"
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
        int parent_id FK "self-reference for replies"
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
        string status "pending, reviewed, resolved"
        datetime created_at
        datetime resolved_at
    }
    
    %% Relationships
    USERS ||--o{ VIDEOS : "uploads"
    USERS ||--o{ COMMENTS : "writes"
    USERS ||--o{ WATCH_HISTORY : "has"
    USERS ||--o{ CONTENT_REPORTS : "reports"
    
    CATEGORIES ||--o{ VIDEOS : "categorizes"
    
    VIDEOS ||--o{ COMMENTS : "has"
    VIDEOS ||--o{ WATCH_HISTORY : "tracked_in"
    VIDEOS ||--o{ CONTENT_REPORTS : "reported_for"
    
    COMMENTS ||--o{ COMMENTS : "replies_to"
```

## 🏗️ Component Architecture

### Frontend Component Hierarchy
```mermaid
graph TD
    A[App.js] --> B[AuthContext]
    A --> C[Router]
    
    C --> D[Navbar]
    C --> E[Home Page]
    C --> F[VideoPlayer Page]
    C --> G[Upload Page]
    C --> H[Profile Page]
    C --> I[Login Page]
    C --> J[Register Page]
    
    E --> K[VideoCard Components]
    F --> L[Video Player]
    F --> M[Comments Component]
    G --> N[File Upload Form]
    G --> O[YouTube Upload Form]
    
    M --> P[Comment Item]
    M --> Q[Reply Form]
    P --> P
    
    K --> R[Video Thumbnail]
    K --> S[Video Info]
```

### Backend Service Architecture
```mermaid
graph TD
    A[FastAPI Main App] --> B[Authentication Service]
    A --> C[Video Service]
    A --> D[Comment Service]
    A --> E[User Service]
    A --> F[Category Service]
    
    B --> G[JWT Handler]
    B --> H[Password Hasher]
    
    C --> I[File Upload Handler]
    C --> J[YouTube Integration]
    C --> K[Video Processing]
    C --> L[Content Moderation]
    
    D --> M[CRUD Operations]
    D --> N[Nested Comments Logic]
    
    K --> O[FFmpeg Processor]
    K --> P[Thumbnail Generator]
    
    J --> Q[YouTube Utils]
    J --> R[oEmbed API Client]
    
    L --> S[Content Filter]
    L --> T[AI Moderation (Future)]
```

## 🔐 Security Architecture

### Authentication & Authorization Flow
```mermaid
graph TD
    A[User Request] --> B{Has JWT Token?}
    B -->|No| C[Redirect to Login]
    B -->|Yes| D[Validate Token]
    
    D --> E{Token Valid?}
    E -->|No| C
    E -->|Yes| F[Extract User Info]
    
    F --> G{Check Permissions}
    G -->|Allowed| H[Process Request]
    G -->|Denied| I[Return 403 Forbidden]
    
    H --> J[Return Response]
```

### Content Security Pipeline
```mermaid
graph TD
    A[Content Upload] --> B[File Type Validation]
    B --> C[Size Validation]
    C --> D[Content Scanning]
    
    D --> E{YouTube Video?}
    E -->|Yes| F[URL Validation]
    E -->|No| G[File Analysis]
    
    F --> H[oEmbed Check]
    H --> I[Basic Content Filter]
    
    G --> J[FFmpeg Analysis]
    J --> K[AI Content Analysis (Future)]
    
    I --> L{Safe for Kids?}
    K --> L
    
    L -->|Yes| M[Auto Approve]
    L -->|No| N[Queue for Manual Review]
    L -->|Uncertain| O[Queue for Manual Review]
```

## 🚀 Deployment Architecture

### Development Environment
```mermaid
graph TB
    subgraph "Developer Machine"
        DEV[Developer]
        CODE[Source Code]
    end
    
    subgraph "Docker Compose Environment"
        F[Frontend Container :3000]
        B[Backend Container :8000]
        DB[PostgreSQL Container :5432]
        R[Redis Container :6379]
        
        F --> B
        B --> DB
        B --> R
    end
    
    DEV --> CODE
    CODE --> F
    CODE --> B
    
    EXT[External APIs<br/>YouTube, etc.] --> B
```

### Production Environment
```mermaid
graph TB
    subgraph "Load Balancer Tier"
        LB1[Nginx LB 1]
        LB2[Nginx LB 2]
    end
    
    subgraph "Application Tier"
        subgraph "Frontend Cluster"
            F1[Frontend 1]
            F2[Frontend 2]
            F3[Frontend N]
        end
        
        subgraph "Backend Cluster"
            B1[Backend 1]
            B2[Backend 2]
            B3[Backend N]
        end
        
        subgraph "Cache Cluster"
            R1[Redis Master]
            R2[Redis Replica 1]
            R3[Redis Replica 2]
        end
    end
    
    subgraph "Data Tier"
        subgraph "Database Cluster"
            DB1[PostgreSQL Primary]
            DB2[PostgreSQL Replica 1]
            DB3[PostgreSQL Replica 2]
        end
        
        subgraph "Storage"
            S3[S3/Object Storage]
            FS[File System Storage]
        end
    end
    
    subgraph "Monitoring & Logging"
        M[Prometheus/Grafana]
        L[ELK Stack]
    end
    
    USERS[Users] --> LB1
    USERS --> LB2
    
    LB1 --> F1
    LB1 --> F2
    LB2 --> F2
    LB2 --> F3
    
    F1 --> B1
    F2 --> B2
    F3 --> B3
    
    B1 --> DB1
    B2 --> DB2
    B3 --> DB3
    
    B1 --> R1
    B2 --> R2
    B3 --> R3
    
    B1 --> S3
    B2 --> S3
    B3 --> S3
    
    B1 --> M
    B2 --> L
    B3 --> M
```

## 📊 Data Pipeline Architecture

### Video Processing Pipeline
```mermaid
graph TD
    A[Video Upload] --> B[Validation Queue]
    B --> C[Content Moderation Queue]
    C --> D[Processing Queue]
    
    D --> E[FFmpeg Processing]
    E --> F[Multiple Quality Generation]
    F --> G[Thumbnail Generation]
    
    G --> H[File Storage]
    H --> I[Database Update]
    I --> J[Cache Invalidation]
    
    K[Failed Processing] --> L[Retry Queue]
    L --> D
    
    E -.->|Failure| K
    F -.->|Failure| K
    G -.->|Failure| K
```

### Comment Processing Pipeline
```mermaid
graph TD
    A[Comment Submission] --> B[Authentication Check]
    B --> C[Content Validation]
    C --> D[Spam Detection]
    
    D --> E{Auto Approve?}
    E -->|Yes| F[Save to Database]
    E -->|No| G[Moderation Queue]
    
    F --> H[Update Cache]
    H --> I[Real-time Notification (Future)]
    
    G --> J[Manual Review]
    J --> K{Approved?}
    K -->|Yes| F
    K -->|No| L[Reject & Log]
```

## 🔍 Monitoring Architecture

### Metrics Collection
```mermaid
graph TD
    subgraph "Application Metrics"
        A1[API Response Times]
        A2[Error Rates]
        A3[Request Counts]
        A4[User Actions]
    end
    
    subgraph "Infrastructure Metrics"
        I1[CPU Usage]
        I2[Memory Usage]
        I3[Disk I/O]
        I4[Network Traffic]
    end
    
    subgraph "Business Metrics"
        B1[Video Upload Rate]
        B2[Comment Engagement]
        B3[User Registration]
        B4[Content Moderation Stats]
    end
    
    A1 --> P[Prometheus]
    A2 --> P
    A3 --> P
    A4 --> P
    
    I1 --> P
    I2 --> P
    I3 --> P
    I4 --> P
    
    B1 --> P
    B2 --> P
    B3 --> P
    B4 --> P
    
    P --> G[Grafana Dashboard]
    P --> AL[AlertManager]
    
    AL --> S[Slack/Email Alerts]
```

---

## 📝 Diagram Legend

### Symbols Used:
- 🔵 **Circle**: External services/APIs
- 🟦 **Rectangle**: Internal services/components  
- 🟨 **Diamond**: Decision points
- 🟩 **Database**: Data storage
- 🔶 **Hexagon**: Load balancers/proxies
- ➡️ **Solid Arrow**: Data flow
- ➡️ **Dotted Arrow**: Optional/future flow

### Color Coding:
- **Blue**: Frontend components
- **Green**: Backend services
- **Orange**: External services
- **Purple**: Data storage
- **Red**: Security/authentication
- **Gray**: Infrastructure

---

📊 **Note**: Những diagrams này được tạo bằng Mermaid và có thể được render trong GitHub, GitLab, và hầu hết các markdown viewers hiện đại.
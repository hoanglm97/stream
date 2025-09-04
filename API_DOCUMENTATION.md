# 📚 KidsStream API Documentation

## 🌐 Base URL
- **Development**: `http://localhost:8000`
- **Production**: `https://your-domain.com/api`

## 🔐 Authentication

Hệ thống sử dụng JWT (JSON Web Tokens) cho authentication.

### Headers Required
```http
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

## 👤 User Management

### POST `/auth/register`
Đăng ký tài khoản mới

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "password123",
  "is_parent": false
}
```

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "username",
  "is_parent": false,
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z"
}
```

### POST `/auth/login`
Đăng nhập

**Request Body (Form Data):**
```
email: user@example.com
password: password123
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer"
}
```

## 🎬 Video Management

### GET `/videos`
Lấy danh sách videos

**Query Parameters:**
- `category_id` (optional): Filter by category
- `age_rating` (optional): Filter by age rating (G, PG, PG-13)
- `skip` (optional): Number of videos to skip (default: 0)
- `limit` (optional): Number of videos to return (default: 20)

**Response:**
```json
[
  {
    "id": 1,
    "title": "Fun Learning Video",
    "description": "Educational content for kids",
    "video_type": "local",
    "youtube_url": null,
    "thumbnail_url": "/thumbnails/1",
    "duration": 300.5,
    "age_rating": "G",
    "view_count": 150,
    "created_at": "2024-01-01T00:00:00Z"
  },
  {
    "id": 2,
    "title": "Math for Kids",
    "description": "Learn basic math",
    "video_type": "youtube",
    "youtube_url": "https://www.youtube.com/watch?v=abc123",
    "thumbnail_url": "https://img.youtube.com/vi/abc123/hqdefault.jpg",
    "duration": 420.0,
    "age_rating": "G",
    "view_count": 89,
    "created_at": "2024-01-02T00:00:00Z"
  }
]
```

### POST `/videos/upload`
Upload video file (Chỉ dành cho Parent accounts)

**Request (Multipart Form):**
```
title: Video Title
description: Video Description
category_id: 1
age_rating: G
file: <video-file>
```

**Response:**
```json
{
  "id": 3,
  "title": "New Video",
  "description": "Description",
  "video_type": "local",
  "youtube_url": null,
  "thumbnail_url": "/thumbnails/3",
  "duration": 180.0,
  "age_rating": "G",
  "created_at": "2024-01-03T00:00:00Z"
}
```

### POST `/videos/youtube`
Thêm YouTube video (Chỉ dành cho Parent accounts)

**Request Body:**
```json
{
  "title": "YouTube Video Title",
  "description": "Description of the video",
  "category_id": 1,
  "age_rating": "G",
  "youtube_url": "https://www.youtube.com/watch?v=abc123"
}
```

**Response:**
```json
{
  "id": 4,
  "title": "YouTube Video Title",
  "description": "Description of the video",
  "video_type": "youtube",
  "youtube_url": "https://www.youtube.com/watch?v=abc123",
  "thumbnail_url": "https://img.youtube.com/vi/abc123/hqdefault.jpg",
  "duration": null,
  "age_rating": "G",
  "created_at": "2024-01-04T00:00:00Z"
}
```

### GET `/videos/{video_id}/stream`
Stream video hoặc lấy YouTube URL

**Response for Local Video:**
```
Binary video stream with appropriate headers
```

**Response for YouTube Video:**
```json
{
  "youtube_url": "https://www.youtube.com/watch?v=abc123",
  "video_type": "youtube"
}
```

### GET `/thumbnails/{video_id}`
Lấy thumbnail của video (chỉ cho local videos)

**Response:**
```
Binary image data (JPEG)
```

## 💬 Comment System

### GET `/videos/{video_id}/comments`
Lấy comments của một video

**Query Parameters:**
- `skip` (optional): Number of comments to skip (default: 0)
- `limit` (optional): Number of comments to return (default: 50)

**Response:**
```json
[
  {
    "id": 1,
    "content": "Great video!",
    "video_id": 1,
    "user_id": 2,
    "username": "parent_user",
    "parent_id": null,
    "created_at": "2024-01-01T10:00:00Z",
    "updated_at": "2024-01-01T10:00:00Z",
    "replies": [
      {
        "id": 2,
        "content": "I agree!",
        "video_id": 1,
        "user_id": 3,
        "username": "another_user",
        "parent_id": 1,
        "created_at": "2024-01-01T10:30:00Z",
        "updated_at": "2024-01-01T10:30:00Z",
        "replies": []
      }
    ]
  }
]
```

### POST `/videos/{video_id}/comments`
Tạo comment mới

**Request Body:**
```json
{
  "content": "This is a great video!",
  "video_id": 1,
  "parent_id": null
}
```

**Response:**
```json
{
  "id": 3,
  "content": "This is a great video!",
  "video_id": 1,
  "user_id": 2,
  "username": "current_user",
  "parent_id": null,
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": "2024-01-01T12:00:00Z",
  "replies": []
}
```

### PUT `/comments/{comment_id}`
Cập nhật comment (chỉ tác giả comment)

**Request Body (Form Data):**
```
content: Updated comment content
```

**Response:**
```json
{
  "id": 3,
  "content": "Updated comment content",
  "video_id": 1,
  "user_id": 2,
  "username": "current_user",
  "parent_id": null,
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": "2024-01-01T12:30:00Z",
  "replies": []
}
```

### DELETE `/comments/{comment_id}`
Xóa comment (tác giả hoặc parent account)

**Response:**
```json
{
  "message": "Comment deleted successfully"
}
```

## 📂 Categories

### GET `/categories`
Lấy danh sách tất cả categories

**Response:**
```json
[
  {
    "id": 1,
    "name": "Education",
    "description": "Educational videos for learning"
  },
  {
    "id": 2,
    "name": "Entertainment",
    "description": "Fun and entertaining content"
  },
  {
    "id": 3,
    "name": "Music",
    "description": "Songs and music videos"
  }
]
```

## 🚨 Error Responses

### Error Format
```json
{
  "detail": "Error message description"
}
```

### Common HTTP Status Codes

#### 400 Bad Request
```json
{
  "detail": "Invalid YouTube URL"
}
```

#### 401 Unauthorized
```json
{
  "detail": "Could not validate credentials"
}
```

#### 403 Forbidden
```json
{
  "detail": "Only parents can upload content"
}
```

#### 404 Not Found
```json
{
  "detail": "Video not found"
}
```

#### 422 Validation Error
```json
{
  "detail": [
    {
      "loc": ["body", "title"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

#### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

## 🔒 Permission System

### User Types
- **Child Account** (`is_parent: false`):
  - Xem videos
  - Comment và reply
  - Chỉnh sửa/xóa comment của mình

- **Parent Account** (`is_parent: true`):
  - Tất cả quyền của Child Account
  - Upload video files
  - Thêm YouTube videos
  - Xóa bất kỳ comment nào

## 📝 Content Moderation

### Video Upload Moderation
- **Local Videos**: Tự động scan title/description cho keywords không phù hợp
- **YouTube Videos**: Kiểm tra cơ bản qua oEmbed API và keyword filtering
- **Manual Review**: Tất cả videos cần được approve trước khi hiển thị

### Comment Moderation
- **Auto-approval**: Comments được auto-approve (có thể thay đổi)
- **Parent Control**: Parent accounts có thể xóa bất kỳ comment nào
- **Content Filtering**: Có thể thêm keyword filtering cho comments

## 🔧 Rate Limiting

### Default Limits
- **API Calls**: 100 requests/minute per IP
- **File Upload**: 5 uploads/hour per user
- **Comments**: 20 comments/hour per user

### Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## 📊 Response Times

### Expected Response Times
- **GET /videos**: < 200ms
- **POST /videos/upload**: 5-30 seconds (depending on file size)
- **POST /videos/youtube**: < 2 seconds
- **GET /videos/{id}/stream**: < 100ms (first byte)
- **Comment operations**: < 100ms

## 🔍 Testing Examples

### Using cURL

#### Login
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=parent@example.com&password=parent123"
```

#### Get Videos
```bash
curl -X GET http://localhost:8000/videos \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Add YouTube Video
```bash
curl -X POST http://localhost:8000/videos/youtube \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Educational Video",
    "description": "Great for kids",
    "category_id": 1,
    "age_rating": "G",
    "youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  }'
```

#### Post Comment
```bash
curl -X POST http://localhost:8000/videos/1/comments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Great video!",
    "video_id": 1,
    "parent_id": null
  }'
```

### Using JavaScript/Axios

#### Setup
```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
```

#### Get Videos
```javascript
const getVideos = async (categoryId = null, ageRating = null) => {
  try {
    const params = {};
    if (categoryId) params.category_id = categoryId;
    if (ageRating) params.age_rating = ageRating;
    
    const response = await api.get('/videos', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching videos:', error.response.data);
  }
};
```

#### Add YouTube Video
```javascript
const addYouTubeVideo = async (videoData) => {
  try {
    const response = await api.post('/videos/youtube', videoData);
    return response.data;
  } catch (error) {
    console.error('Error adding YouTube video:', error.response.data);
  }
};
```

## 📱 WebSocket Support (Future Enhancement)

### Real-time Comments
```javascript
// Planned for future versions
const ws = new WebSocket('ws://localhost:8000/ws/video/1/comments');

ws.onmessage = (event) => {
  const newComment = JSON.parse(event.data);
  // Update UI with new comment
};
```

## 🚀 API Versioning

### Current Version
- **Version**: v1
- **Base Path**: `/` (no version prefix currently)

### Future Versioning
- **v2**: `/api/v2/` (when breaking changes are introduced)
- **Deprecation**: v1 APIs will be deprecated with 6 months notice

---

📝 **Lưu ý**: API này đang trong quá trình phát triển. Vui lòng kiểm tra changelog cho các cập nhật mới.
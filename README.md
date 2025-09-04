# KidsStream - Safe Video Platform for Children 🎬

A comprehensive video streaming platform designed specifically for children, with robust content moderation, parental controls, and educational focus.

## 🌟 Features

### For Children
- **Safe Content**: All videos are moderated for child-appropriate content
- **Educational Focus**: Learning videos covering math, science, language, and more
- **Age-Appropriate Ratings**: G, PG, and PG-13 content ratings
- **Kid-Friendly Interface**: Colorful, intuitive design with large buttons and clear navigation
- **Watch History**: Track viewing progress and favorite videos

### For Parents
- **Content Upload**: Parents can upload and share educational videos
- **Parental Controls**: Only parent accounts can upload content
- **Content Moderation**: Automated and manual review of all uploaded content
- **Safety Reports**: Report inappropriate content for review
- **Account Management**: Separate parent and child account types

### Technical Features
- **Video Streaming**: Efficient video streaming with multiple quality options
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Real-time Processing**: Automatic video processing and thumbnail generation
- **Search & Filter**: Find content by category, age rating, and keywords
- **Progressive Web App**: Fast loading and offline-capable

## 🏗️ Architecture

### Backend (Python/FastAPI)
- **FastAPI**: Modern, fast web framework for building APIs
- **PostgreSQL**: Robust database for storing user and video metadata
- **SQLAlchemy**: ORM for database operations
- **JWT Authentication**: Secure user authentication
- **FFmpeg**: Video processing and thumbnail generation
- **Content Moderation**: AI-powered content analysis

### Frontend (React.js)
- **React 18**: Modern React with hooks and functional components
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **React Router**: Client-side routing
- **Axios**: HTTP client for API communication
- **React Player**: Video player component with streaming support

### Infrastructure
- **Docker**: Containerized deployment
- **PostgreSQL**: Primary database
- **Redis**: Caching and background job processing
- **Nginx**: Reverse proxy and static file serving

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kidsstream
   ```

2. **Start the services**
   ```bash
   docker-compose up -d
   ```

3. **Initialize the database**
   ```bash
   docker-compose exec backend python init_db.py
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Local Development

#### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `.env` file from `.env.example` and update the configuration.

```bash
# Initialize database
python init_db.py

# Start the server
uvicorn main:app --reload
```

#### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## 👥 Sample User Accounts

After running the database initialization, you can use these sample accounts:

### Admin Account
- **Email**: admin@kidsstream.com
- **Password**: admin123
- **Type**: Parent (can upload content)

### Parent Account
- **Email**: parent@example.com
- **Password**: parent123
- **Type**: Parent (can upload content)

### Child Account
- **Email**: child@example.com
- **Password**: child123
- **Type**: Child (view-only access)

## 📁 Project Structure

```
kidsstream/
├── backend/                 # Python/FastAPI backend
│   ├── main.py             # Main application file
│   ├── models.py           # Database models
│   ├── auth.py             # Authentication logic
│   ├── video_processing.py # Video processing utilities
│   ├── content_moderation.py # Content safety checks
│   └── requirements.txt    # Python dependencies
├── frontend/               # React.js frontend
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts (Auth, etc.)
│   │   └── App.js          # Main App component
│   └── package.json        # Node.js dependencies
├── docker-compose.yml      # Docker services configuration
└── README.md              # This file
```

## 🛡️ Content Safety

### Automated Moderation
- **Text Analysis**: Scans titles and descriptions for inappropriate keywords
- **Video Analysis**: Basic frame analysis for violent or inappropriate content
- **Age Rating Verification**: Ensures content matches declared age rating

### Manual Review Process
- All uploaded content requires approval before publication
- Parent accounts can report inappropriate content
- Content moderators review flagged videos

### Safety Features
- Child-safe search results only
- No external links or advertisements
- Secure user authentication
- Regular content audits

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# Database
DATABASE_URL=postgresql://kidsstream:kidsstream123@localhost:5432/kidsstream_db

# Security
SECRET_KEY=your-very-long-secret-key-here

# File Storage
UPLOAD_DIR=uploads
PROCESSED_DIR=processed
THUMBNAILS_DIR=thumbnails

# Optional: Cloud Storage
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_S3_BUCKET=your-bucket-name
```

## 📈 Scaling Considerations

### Database Optimization
- Implement database indexing for video searches
- Use read replicas for heavy read workloads
- Consider database sharding for large datasets

### Video Storage
- Integrate with cloud storage (AWS S3, Google Cloud Storage)
- Implement CDN for global video delivery
- Use adaptive bitrate streaming for optimal performance

### Content Delivery
- Set up CDN for static assets and videos
- Implement video transcoding pipeline
- Use edge caching for frequently accessed content

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow PEP 8 for Python code
- Use ESLint and Prettier for JavaScript code
- Write tests for new features
- Update documentation for API changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@kidsstream.com or create an issue in the GitHub repository.

## 🙏 Acknowledgments

- **FastAPI** - For the excellent web framework
- **React** - For the powerful frontend library
- **Tailwind CSS** - For the utility-first CSS framework
- **FFmpeg** - For video processing capabilities
- **PostgreSQL** - For reliable data storage

---

Made with ❤️ for children's safe learning and entertainment.
# Mushaf with Notes - Backend API

A modern digital Mushaf application backend that preserves the authenticity of the Medina Mushaf while offering enhanced interactivity for personal study, memorization, and annotation.

## 🎯 Features

- **604 Page Navigation**: Complete Medina Mushaf with high-resolution pages
- **Word-Level Interactions**: Underline, highlight, and bookmark specific words
- **Letter-Level Marking**: Zoom into words and mark specific letters or harakat
- **Smart Notes System**: Add titled notes aligned with specific lines and positions
- **Multi-Mushaf Instances**: Users can create multiple personalized Mushaf copies
- **Mistake Categorization**: Notes classified as memorization, tajweed, or general
- **Advanced Search**: Search across notes, marks, and Quran text
- **JWT Authentication**: Secure user authentication and authorization

## 🏗️ Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, CORS, Rate Limiting, Input Validation
- **Containerization**: Docker + Docker Compose

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB 7.0+
- Docker & Docker Compose (for containerized deployment)

## 🚀 Quick Start

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/YahyaKassab/Mushaf_with_notes.git
   cd Mushaf_with_notes
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB** (if running locally)
   ```bash
   mongod
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the API**
   - Health Check: http://localhost:3000/health
   - API Documentation: http://localhost:3000/api

### Docker Deployment

1. **Build and start services**
   ```bash
   docker-compose up -d
   ```

2. **View logs**
   ```bash
   docker-compose logs -f api
   ```

3. **Stop services**
   ```bash
   docker-compose down
   ```

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | User logout |
| GET | `/api/auth/profile` | Get user profile |
| PUT | `/api/auth/profile` | Update user profile |

### Mushaf Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/mushafs` | Get user's Mushafs |
| POST | `/api/mushafs` | Create new Mushaf |
| GET | `/api/mushafs/:id` | Get specific Mushaf |
| PUT | `/api/mushafs/:id` | Update Mushaf |
| DELETE | `/api/mushafs/:id` | Delete Mushaf |
| PATCH | `/api/mushafs/:id/current-page` | Update current page |

### Page Navigation

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pages` | Get all pages |
| GET | `/api/pages/:pageNumber` | Get specific page |
| GET | `/api/pages/:pageNumber/words` | Get word coordinates |
| GET | `/api/pages/:pageNumber/lines` | Get line coordinates |

### Notes System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notes` | Get notes for Mushaf |
| POST | `/api/notes` | Create new note |
| GET | `/api/notes/:id` | Get specific note |
| PUT | `/api/notes/:id` | Update note |
| DELETE | `/api/notes/:id` | Delete note |

### Word Interactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/interactions` | Get word interactions |
| POST | `/api/interactions` | Create interaction |
| POST | `/api/interactions/toggle` | Toggle interaction |
| PUT | `/api/interactions/:id` | Update interaction |
| DELETE | `/api/interactions/:id` | Delete interaction |

### Letter Marks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/marks` | Get letter marks |
| POST | `/api/marks` | Create letter mark |
| PUT | `/api/marks/:id` | Update letter mark |
| DELETE | `/api/marks/:id` | Delete letter mark |

### Search

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/search` | Global search |
| GET | `/api/search/notes` | Search in notes |
| GET | `/api/search/quran` | Search in Quran text |
| POST | `/api/search/advanced` | Advanced search |

## 📊 Database Schema

### Collections

- **Users**: Authentication and profile data
- **Mushafs**: Personal Mushaf instances
- **Pages**: Static page images and coordinate mapping
- **Notes**: User notes tied to pages and lines
- **WordInteractions**: Word-level underlines/highlights
- **LetterMarks**: Letter-specific interactions

## 🔐 Security Features

- JWT-based authentication with refresh tokens
- Input validation using Joi
- Rate limiting (100 requests per 15 minutes)
- CORS configuration
- Helmet security headers
- MongoDB injection protection
- Password hashing with bcrypt

## 🐳 Docker Configuration

The application includes production-ready Docker configuration:

- **Multi-stage build** for optimized image size
- **Non-root user** for security
- **Health checks** for both API and database
- **Volume mounting** for data persistence
- **Network isolation** between services

## 📝 Environment Variables

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/mushaf_with_notes

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

# API Configuration
API_RATE_LIMIT=100
API_WINDOW_MS=900000

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run with coverage
npm run test:coverage
```

## 📦 Project Structure

```
├── config/           # Database and configuration files
├── middleware/       # Express middleware (auth, validation)
├── models/          # MongoDB/Mongoose models
├── routes/          # API route handlers
├── utils/           # Utility functions (JWT, helpers)
├── server.js        # Main application entry point
├── Dockerfile       # Docker configuration
├── docker-compose.yml # Docker Compose setup
└── package.json     # Dependencies and scripts
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 👤 Author

**Yahya Kassab**

## 🙏 Acknowledgments

- Al-Quran Cloud API for Quran text data
- The MongoDB team for the excellent database
- The Node.js and Express communities
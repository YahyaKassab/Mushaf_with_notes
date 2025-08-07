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

### Option 1: Quick Setup (Recommended)
```bash
# Clone and install
git clone <repository-url>
cd Mushaf_with_notes
npm install

# Copy environment configuration
cp .env.example .env
# Edit .env with your settings (MongoDB URI, etc.)

# Run quick setup (sets up everything + sample data)
npm run setup

# Start development server
npm run dev
```

### Option 2: Manual Setup
```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Configure your .env file

# Start MongoDB (if local)
mongod

# Start the server
npm run dev

# In another terminal, populate data
npm run populate:sample  # First 10 pages
# or
npm run populate        # All 604 pages (takes 20-30 minutes)
```

### Option 3: Docker Setup
```bash
# Using Docker Compose
docker-compose up -d

# Populate data
docker-compose exec app npm run setup
```

## 📊 Data Population

The application automatically fetches Quran verses and page images from **Quran.com API** and **QuranCDN**.

### Available Scripts
- `npm run setup` - Quick setup with sample data (5 pages)
- `npm run populate:sample` - Populate first 10 pages
- `npm run populate` - Populate all 604 pages (~20-30 minutes)
- `npm run populate -- -s 50 -e 100` - Populate pages 50-100
- `npm run populate -- --force` - Force update existing pages

### Data Sources
- **Verses**: Quran.com API (`api.quran.com`)
- **Images**: QuranCDN (`cdn.qurancdn.com`)
- **Coordinates**: Quran Cloud API (`api.qurancdn.com`)

### Storage Requirements
- **Sample data (10 pages)**: ~20MB
- **Complete dataset (604 pages)**: ~500MB
- **High-quality images**: ~800KB per page
- **Medium-quality images**: ~400KB per page

## 🛠️ Development

### Prerequisites
- Node.js 18+
- MongoDB 7.0+
- Internet connection (for initial data population)

### Environment Configuration
Copy `.env.example` to `.env` and configure:

```bash
# Server
PORT=3000
BASE_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/mushaf_with_notes

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# API Rate Limiting
API_RATE_LIMIT=100
API_WINDOW_MS=900000
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

## 🧪 API Testing with Postman

This repository includes a comprehensive Postman collection for testing all API endpoints:

- **`Mushaf_with_Notes_API.postman_collection.json`** - Complete collection with 35+ endpoints
- **`Mushaf_with_Notes_Development.postman_environment.json`** - Environment variables
- **`POSTMAN_GUIDE.md`** - Detailed usage guide

### Quick Setup
1. Import both JSON files into Postman
2. Select the "Mushaf with Notes - Development" environment
3. Start with Health Check → Register/Login → Create Mushaf
4. All authentication tokens and IDs are automatically managed

### Key Features
- ✅ Automatic JWT token management
- ✅ Smart ID saving for created resources
- ✅ Comprehensive test coverage
- ✅ Realistic sample data
- ✅ Complete endpoint documentation
- ✅ Error handling examples

For detailed instructions, see [`POSTMAN_GUIDE.md`](./POSTMAN_GUIDE.md).

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
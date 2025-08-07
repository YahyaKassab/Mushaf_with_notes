# Mushaf with Notes API - Postman Collection

This directory contains a comprehensive Postman collection for testing and interacting with the Mushaf with Notes API.

## 📦 Files Included

- **`Mushaf_with_Notes_API.postman_collection.json`** - Complete API collection with all endpoints
- **`Mushaf_with_Notes_Development.postman_environment.json`** - Environment variables for easy testing
- **`POSTMAN_GUIDE.md`** - This guide

## 🚀 Quick Start

### 1. Import into Postman

1. Open Postman
2. Click "Import" in the top left
3. Drag and drop both JSON files or use "Choose Files"
4. Select both the collection and environment files

### 2. Set Up Environment

1. Click the environment dropdown (top right)
2. Select "Mushaf with Notes - Development"
3. Verify the `baseUrl` is set to your server URL (default: `http://localhost:3000`)

### 3. Start Testing

1. **First, start your API server** (see main README)
2. Test the **Health Check** endpoint to verify connectivity
3. **Register a new user** or **Login** with existing credentials
4. The authentication tokens will be automatically saved for subsequent requests

## 📚 Collection Structure

### 🏥 Health & Documentation
- **Health Check** - Verify API server status
- **API Documentation** - Get comprehensive endpoint listing

### 🔐 Authentication
- **Register User** - Create new account (auto-saves tokens)
- **Login User** - Authenticate existing user (auto-saves tokens)
- **Refresh Token** - Get new access token
- **Get Profile** - Retrieve user information
- **Update Profile** - Modify user details and preferences
- **Logout** - End session and invalidate tokens

### 📖 Mushafs
- **Get All Mushafs** - List user's Mushaf collections
- **Create Mushaf** - Create new personal Mushaf (auto-saves ID)
- **Get Specific Mushaf** - Retrieve Mushaf details
- **Update Mushaf** - Modify Mushaf settings
- **Update Current Page** - Track reading progress
- **Get Mushaf Statistics** - View usage statistics
- **Delete Mushaf** - Remove Mushaf and related data

### 📄 Pages
- **Get All Pages** - List available pages with pagination
- **Get Specific Page** - Complete page data with coordinates
- **Get Page Metadata** - Image and surah information only
- **Get Page Word Coordinates** - Word positioning data
- **Get Page Line Coordinates** - Line positioning data
- **Search Words on Page** - Find specific text on a page

### 📝 Notes
- **Get Notes** - List notes with filters
- **Create Note** - Add line-aligned annotation (auto-saves ID)
- **Get Specific Note** - Retrieve note details
- **Update Note** - Modify note content and properties
- **Get Notes by Page** - Page-specific notes
- **Search Notes** - Find notes by content
- **Delete Note** - Remove note

### 🎯 Word Interactions
- **Get Word Interactions** - List highlights, underlines, bookmarks
- **Create Word Interaction** - Add word-level marking (auto-saves ID)
- **Toggle Word Interaction** - Smart create/delete based on existence
- **Get Specific Word Interaction** - Retrieve interaction details
- **Get Interactions by Word** - All interactions for specific word
- **Update Word Interaction** - Modify styling
- **Delete Word Interaction** - Remove interaction

### 🔴 Letter Marks
- **Get Letter Marks** - List letter-level marks with filters
- **Create Letter Mark** - Add precise letter marking (auto-saves ID)
- **Get Specific Letter Mark** - Retrieve mark details
- **Get Marks by Word** - All marks for specific word
- **Get Marks by Category** - Category-filtered marks
- **Search Letter Marks** - Find marks by note content
- **Update Letter Mark** - Modify coordinates, style, or notes
- **Delete Letter Mark** - Remove mark

### 🔍 Search
- **Global Search** - Search across all user data
- **Search Notes** - Notes-specific search with pagination
- **Search Quran Text** - Find text in Quran with highlighting
- **Advanced Search** - Complex search with date ranges and filters
- **Search Suggestions** - Autocomplete based on user data

## 🔧 Key Features

### Automatic Token Management
- Login and registration automatically save JWT tokens
- All authenticated endpoints use the saved tokens
- No manual token copying required

### Smart ID Management
- Create operations automatically save generated IDs
- Subsequent operations use the saved IDs
- No manual ID copying required

### Comprehensive Testing
- Each request includes relevant tests
- Response time validation
- Success field verification
- Status code checks

### Realistic Sample Data
- All requests include proper example payloads
- Sample coordinates and positioning data
- Realistic Arabic text examples where applicable

## 🧪 Recommended Testing Flow

### 1. Authentication Flow
```
Health Check → Register User → Login User → Get Profile
```

### 2. Mushaf Setup
```
Create Mushaf → Get All Mushafs → Update Current Page
```

### 3. Content Creation
```
Create Note → Create Word Interaction → Create Letter Mark
```

### 4. Data Retrieval
```
Get Notes → Get Interactions → Get Marks → Search (various)
```

### 5. Updates and Cleanup
```
Update Note → Update Interaction → Delete entities → Logout
```

## 🔍 Environment Variables

The environment includes these automatically managed variables:

- **`baseUrl`** - API server address
- **`accessToken`** - JWT access token (auto-populated)
- **`refreshToken`** - JWT refresh token (auto-populated)
- **`userId`** - Current user ID (auto-populated)
- **`mushafId`** - Active Mushaf ID (auto-populated)
- **`noteId`** - Sample note ID (auto-populated)
- **`interactionId`** - Sample interaction ID (auto-populated)
- **`markId`** - Sample mark ID (auto-populated)

## 📊 Response Examples

### Successful Authentication
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Paginated Results
```json
{
  "success": true,
  "data": {
    "notes": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 47,
      "itemsPerPage": 10
    }
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Validation Error",
  "errors": ["Email is required", "Password must be at least 8 characters"]
}
```

## 🚨 Important Notes

### Authentication Required
Most endpoints require authentication. Make sure to:
1. Login first to get tokens
2. Use the "Authorization" header with Bearer token
3. Refresh tokens when they expire

### Rate Limiting
The API has rate limiting (100 requests per 15 minutes). If you hit the limit:
- Wait for the window to reset
- Check the rate limit headers in responses

### MongoDB ObjectIds
Some endpoints expect MongoDB ObjectId format:
- Use the provided sample IDs for testing
- Real IDs will be generated when you create entities

### Page Numbers
Quran pages are numbered 1-604 (Medina Mushaf standard):
- Use valid page numbers in requests
- Invalid page numbers will return 400 errors

## 🔧 Troubleshooting

### Common Issues

**401 Unauthorized**
- Token expired: Use refresh token endpoint
- No token: Login first
- Invalid token: Re-authenticate

**404 Not Found**
- Invalid endpoint: Check URL spelling
- Resource doesn't exist: Verify IDs
- Wrong HTTP method: Check method type

**400 Bad Request**
- Missing required fields: Check request body
- Invalid data format: Verify JSON structure
- Invalid page numbers: Use 1-604 range

**429 Too Many Requests**
- Rate limit exceeded: Wait and retry
- Check rate limit headers for reset time

### Server Connection Issues
1. Verify API server is running
2. Check `baseUrl` in environment
3. Ensure no firewall blocking
4. Verify MongoDB connection

## 📖 Additional Resources

- **Main API Documentation** - See main README.md
- **Docker Setup** - docker-compose.yml for local development
- **Environment Configuration** - .env.example for server setup

## 🤝 Contributing

When adding new endpoints:
1. Add to collection with proper authentication
2. Include realistic example data
3. Add appropriate tests
4. Update this guide
5. Test the complete flow

---

For more detailed API documentation, see the main project README or visit `/api` endpoint when the server is running.
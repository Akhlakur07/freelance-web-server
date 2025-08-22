# 🚀 TaskForce Backend API Server

A robust, scalable backend server for the TaskForce freelance platform. Built with Node.js, Express.js, and MongoDB, providing RESTful APIs for user management and task operations.

## 🌐 Frontend Application

**Live Frontend:** [https://freelance-auth-96883.web.app/](https://freelance-auth-96883.web.app/)

## ✨ Features

### 🔐 User Management

- **User Registration & Updates** - Create and modify user profiles
- **User Authentication** - Secure user data management
- **Profile Management** - Handle user bio, photo, and preferences
- **Email-based Identification** - Unique user identification system

### 📋 Task Management System

- **CRUD Operations** - Complete task lifecycle management
- **Task Categories** - Organized task classification
- **Budget Management** - Financial planning and tracking
- **Deadline Handling** - Time-sensitive task management
- **Bidding System** - Track task interest and applications

### 🛡️ Security & Validation

- **Input Validation** - Comprehensive data sanitization
- **Authorization Checks** - User permission verification
- **Error Handling** - Robust error management system
- **CORS Support** - Cross-origin resource sharing

### 🚀 Performance & Scalability

- **MongoDB Atlas** - Cloud-hosted database solution
- **Connection Pooling** - Optimized database connections
- **Indexed Queries** - Fast data retrieval
- **Response Optimization** - Efficient data formatting

## 🛠️ Tech Stack

### Core Technologies

- **Node.js** - JavaScript runtime environment
- **Express.js** - Fast, unopinionated web framework
- **MongoDB** - NoSQL document database
- **MongoDB Atlas** - Cloud database hosting

### Development & Deployment

- **dotenv** - Environment variable management
- **CORS** - Cross-origin resource sharing
- **Vercel** - Serverless deployment platform

## 📁 Project Structure

```
freelance-server/
├── index.js              # Main server file with all API endpoints
├── package.json          # Dependencies and scripts
├── vercel.json           # Vercel deployment configuration
├── .env                  # Environment variables (not in repo)
└── README.md             # This file
```

## 🗄️ Database Schema

### Users Collection

```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  photo: String (URL),
  bio: String,
  authProvider: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Tasks Collection

```javascript
{
  _id: ObjectId,
  title: String,
  category: String,
  description: String,
  deadline: Date,
  budget: Number,
  author: {
    email: String,
    name: String
  },
  status: String (default: "open"),
  bidsCount: Number,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔌 API Endpoints

### User Management

#### `POST /users`

**Create or Update User**

- **Body:** `{ name, email, photo, bio, authProvider }`
- **Response:** `{ ok: true, created: boolean, email }`
- **Status:** `201` (created) or `200` (updated)

#### `GET /users/:email`

**Get User by Email**

- **Params:** `email` - User's email address
- **Response:** User object with profile information
- **Status:** `200` (success) or `404` (not found)

### Task Management

#### `POST /tasks`

**Create New Task**

- **Body:** `{ title, category, description, deadline, budget, userEmail, userName }`
- **Response:** `{ ok: true, id: taskId }`
- **Status:** `201` (created)

#### `GET /tasks`

**List Tasks with Filters**

- **Query Params:**
  - `email` - Filter by author email
  - `category` - Filter by task category
- **Response:** Array of task objects
- **Status:** `200` (success)

#### `GET /tasks/:id`

**Get Single Task**

- **Params:** `id` - Task ObjectId
- **Response:** Complete task object
- **Status:** `200` (success) or `404` (not found)

#### `PATCH /tasks/:id`

**Update Task**

- **Params:** `id` - Task ObjectId
- **Query:** `email` - Author's email for authorization
- **Body:** `{ title, category, description, deadline, budget }`
- **Response:** `{ ok: true, id: taskId }`
- **Status:** `200` (success) or `403` (unauthorized)

#### `DELETE /tasks/:id`

**Delete Task**

- **Params:** `id` - Task ObjectId
- **Query:** `email` - Author's email for authorization
- **Response:** `{ ok: true, id: taskId }`
- **Status:** `200` (success) or `403` (unauthorized)

#### `POST /tasks/:id/bid`

**Submit Task Bid**

- **Params:** `id` - Task ObjectId
- **Response:** `{ ok: true, bidsCount: number }`
- **Status:** `200` (success)

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager
- MongoDB Atlas account
- Vercel account (for deployment)

### Local Development Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/Akhlakur07/freelance-web-server.git
   cd freelance-web/freelance-server
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:

   ```env
   PORT=3000
   DB_USER=your_mongodb_username
   DB_PASS=your_mongodb_password
   ```

4. **MongoDB Setup**

   - Create a MongoDB Atlas cluster
   - Get your connection string
   - Update the connection URI in `index.js`

5. **Start development server**
   ```bash
   node index.js
   ```

### Production Deployment

1. **Vercel Deployment**

   ```bash
   npm install -g vercel
   vercel
   ```

2. **Environment Variables**
   Set the following in Vercel dashboard:
   - `DB_USER`
   - `DB_PASS`

## 🔧 Available Scripts

- `npm start` - Start the production server
- `node index.js` - Run the server directly

## 🗄️ Database Configuration

### MongoDB Atlas Setup

1. Create a new cluster in MongoDB Atlas
2. Set up database access with username/password
3. Configure network access (IP whitelist or 0.0.0.0/0)
4. Get your connection string
5. Update the `uri` variable in `index.js`

### Connection Options

```javascript
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
```

## 🛡️ Security Features

### Input Validation

- **Required Fields** - Essential data validation
- **Data Types** - Proper type checking
- **String Sanitization** - Trim and clean input data
- **Date Validation** - ISO date format verification

### Authorization

- **Email Verification** - User ownership validation
- **Permission Checks** - Task modification restrictions
- **Secure Operations** - Protected CRUD operations

### Error Handling

- **Graceful Failures** - Proper error responses
- **Status Codes** - HTTP-compliant responses
- **Error Logging** - Console error tracking
- **User Feedback** - Clear error messages

## 📊 API Response Format

### Success Response

```json
{
  "ok": true,
  "data": {...},
  "message": "Operation successful"
}
```

### Error Response

```json
{
  "error": "Error description",
  "status": 400
}
```

## 🚀 Performance Optimizations

- **Connection Pooling** - Efficient database connections
- **Indexed Queries** - Fast data retrieval
- **Response Limiting** - Pagination support (100 items max)
- **Data Normalization** - Optimized response format

## 🔍 Monitoring & Logging

- **Connection Status** - MongoDB connection monitoring
- **Error Logging** - Comprehensive error tracking
- **Performance Metrics** - Response time monitoring
- **Health Checks** - Server status verification

## 🌟 Highlights

- **RESTful Design** - Standard HTTP methods and status codes
- **Scalable Architecture** - Cloud-ready deployment
- **Comprehensive Validation** - Robust data integrity
- **Security First** - Authorization and input sanitization
- **Production Ready** - Error handling and monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact

- **Frontend Repository:** [https://github.com/Akhlakur07/freelance-web-client](https://github.com/Akhlakur07/freelance-web-client)
- **Live site:** [https://freelance-auth-96883.web.app/](https://freelance-auth-96883.web.app/)

## 🙏 Acknowledgments

- MongoDB team for the excellent database
- Express.js community for the robust framework
- Vercel for seamless deployment
- Node.js team for the runtime environment

---

⭐ **Star this repository if you find it helpful!**

# MySQL Management System 🚀

A powerful and intuitive MySQL database management system built with Node.js and TypeScript. This project provides a modern web interface for managing MySQL databases, tables, and queries with ease. Perfect for developers and database administrators who need a streamlined way to handle MySQL operations.

## 🚀 Latest Features (v1.1) - Released December 19, 2024

- **Advanced Query Interface**: 
  - Direct SQL query input for data insertion
  - Interactive query builder for complex SQL operations
- **Improved Table Management**:
  - Intuitive table creation wizard
  - Best practices templates for common table structures
  - Advanced column type configuration

## 🌟 Base Features (v1.0.0) - Released December 14, 2024

- **Database Operations**: 
  - Create and delete databases
  - Basic table management
  - Database backup and restore
- **Basic Query Interface**: Execute simple SQL queries
- **User Management**: Manage MySQL user permissions and access
- **Data Import/Export**: Easy data import and export functionality
- **Monitoring**: Track database performance and query execution times
- **TypeScript Support**: Built with TypeScript for better type safety and developer experience
- **RESTful API**: Well-structured API endpoints for all database operations
- **Modern UI**: Intuitive and responsive user interface for seamless database management

## 🛠️ Tech Stack

- **Backend**:
  - Node.js
  - TypeScript
  - Express.js
  - MYSQL

- **Frontend**:
  - React/Vite
  - Modern UI components
  - State management

## 📦 Installation

1. **Clone the repository**
```bash
git clone https://github.com/caaqilyare/mysql-manegment
cd mysql-manegment
```

2. **Install dependencies**
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
```

3. **Environment Setup**
```bash
# Copy the example env file
cp .env.example .env


PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=management_db

```

## 🚀 Getting Started

1. **Start the backend server**
```bash
npm run dev
```

2. **Start the frontend development server**
```bash
cd frontend
npm run dev
```

The application should now be running on:
- Backend: `http://localhost:3000`
- Frontend: `http://localhost:3001`

## 📝 API Documentation

### Available Endpoints

- `GET /api/v1/...` - Description
- `POST /api/v1/...` - Description
- Add more endpoints as they are implemented

## 🧪 Testing

```bash
# Run backend tests
npm test

# Run frontend tests
cd frontend
npm test
```

## 📈 Project Structure

```
managment/
├── src/
│   ├── routes/          # API routes
│   ├── controllers/     # Request handlers
│   ├── models/         # Data models
│   └── utils/          # Utility functions
├── frontend/
│   ├── src/
│   ├── public/
│   └── ...
└── ...
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- Munasar Abuukar - Full Stack Developer

## 🙏 Acknowledgments

- List any inspirations, code snippets, etc.
- Add credits for any third-party assets or libraries used

## 🆕 What's New in v1.1

- **Enhanced SQL Query Input**: Added direct SQL query input functionality for efficient data insertion
- **Improved Table Creation**: New table creation wizard with best practice templates and advanced configuration options
- **Query Builder Updates**: Enhanced support for complex SQL operations

---
Made with ❤️ and ☕

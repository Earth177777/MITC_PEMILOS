# Electronic Voting System

A secure, modern electronic voting system built with NestJS backend and React frontend, designed for SMA Maitreyawira & MITC Club elections.

## 🚀 Features

- **Secure Voting**: JWT-based authentication with role-based access control
- **Real-time Results**: Live vote counting and result display
- **Audit Trail**: Comprehensive logging of all voting activities
- **Responsive Design**: Mobile-friendly interface for all devices
- **Admin Dashboard**: Complete election management and monitoring
- **Data Integrity**: SQLite database with proper migrations and constraints

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (React +      │◄──►│   (NestJS +     │◄──►│   (SQLite)      │
│   TypeScript)   │    │   TypeScript)   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Tech Stack

**Backend:**
- NestJS (Node.js framework)
- TypeScript
- TypeORM (Database ORM)
- SQLite (Database)
- JWT (Authentication)
- Bcrypt (Password hashing)
- Class Validator (Input validation)

**Frontend:**
- React 18
- TypeScript
- Vite (Build tool)
- Tailwind CSS (Styling)
- React Router (Navigation)
- Axios (HTTP client)

**DevOps:**
- Docker & Docker Compose
- Multi-stage builds
- Nginx (Production web server)
- Health checks

## 📋 Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for containerized deployment)
- Git

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd electronic-voting-system
   ```

2. **Start the application:**
   ```bash
   # Production mode
   docker-compose up -d
   
   # Development mode
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
   ```

3. **Access the application:**
   - Frontend: http://localhost (production) or http://localhost:5173 (development)
   - Backend API: http://localhost:3001

### Option 2: Local Development

1. **Clone and setup:**
   ```bash
   git clone <repository-url>
   cd electronic-voting-system
   ```

2. **Backend setup:**
   ```bash
   cd backend
   npm install
   npm run migrate  # Run database migrations
   npm run start:dev
   ```

3. **Frontend setup (in new terminal):**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## 📚 Documentation

- [API Documentation](./docs/API.md) - Complete REST API reference
- [Setup Guide](./docs/SETUP.md) - Detailed installation and configuration
- [Architecture Overview](./docs/ARCHITECTURE.md) - System design and components
- [Deployment Guide](./docs/DEPLOYMENT.md) - Production deployment instructions

## 🔧 Development

### Project Structure

```
electronic-voting-system/
├── backend/                 # NestJS backend application
│   ├── src/
│   │   ├── auth/           # Authentication module
│   │   ├── candidates/     # Candidate management
│   │   ├── votes/          # Voting logic
│   │   ├── audit-logs/     # Audit trail
│   │   └── database/       # Database configuration
│   ├── db/                 # Database files
│   ├── scripts/            # Utility scripts
│   └── test/               # Test files
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── types/          # TypeScript types
│   └── public/             # Static assets
├── docs/                   # Documentation
└── docker-compose.yml      # Container orchestration
```

### Available Scripts

**Backend:**
```bash
npm run start:dev    # Start development server
npm run build        # Build for production
npm run test         # Run tests
npm run migrate      # Run database migrations
npm run lint         # Lint code
```

**Frontend:**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
npm run lint         # Lint code
```

### Testing

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# Run all tests
npm run test:all
```

## 🔒 Security Features

- **Authentication**: JWT-based with secure token handling
- **Authorization**: Role-based access control (Admin/Voter)
- **Input Validation**: Comprehensive validation on all endpoints
- **Password Security**: Bcrypt hashing with salt rounds
- **SQL Injection Prevention**: TypeORM parameterized queries
- **CORS Protection**: Configured for production domains
- **Rate Limiting**: API endpoint protection
- **Audit Logging**: Complete activity tracking

## 🚀 Deployment

### Production Deployment with Docker

1. **Build and start services:**
   ```bash
   docker-compose up -d --build
   ```

2. **Check service health:**
   ```bash
   docker-compose ps
   docker-compose logs
   ```

3. **Scale services (if needed):**
   ```bash
   docker-compose up -d --scale backend=2
   ```

### Environment Variables

Create `.env` files for configuration:

**Backend (.env):**
```env
NODE_ENV=production
DATABASE_PATH=./db/electronic_voting_system.sqlite
DATABASE_LOGGING=false
JWT_SECRET=your-super-secret-jwt-key
PORT=3001
```

**Frontend (.env):**
```env
VITE_API_BASE_URL=http://localhost:3001
```

## Default Credentials

**Admin Account:**
- Username: admin
- Password: admin123

**Test Voter Account:**
- Username: voter1
- Password: voter123

## API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /auth/profile` - Get user profile

### Candidates
- `GET /candidates` - Get all candidates
- `POST /candidates` - Create candidate (admin only)
- `PUT /candidates/:id` - Update candidate (admin only)
- `DELETE /candidates/:id` - Delete candidate (admin only)

### Votes
- `POST /votes` - Cast a vote
- `GET /votes/results` - Get voting results
- `GET /votes/my-vote` - Get user's vote

### Users
- `GET /users` - Get all users (admin only)
- `PUT /users/:id` - Update user (admin only)
- `DELETE /users/:id` - Delete user (admin only)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation in the `docs/` folder

## 🔄 Version History

- **v1.0.0** - Initial release with core voting functionality
- **v1.1.0** - Added Docker support and improved security
- **v1.2.0** - Enhanced UI/UX and audit features

---

**Built with ❤️ for SMA Maitreyawira & MITC Club**
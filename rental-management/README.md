# Rental Management System

A full-stack MERN application for managing rental products and bookings.

## Features

- User authentication (Customer & Admin roles)
- Product catalog with search and filtering
- Booking system with real-time availability
- Payment integration ready
- Admin dashboard for management
- Responsive design with Tailwind CSS

## Tech Stack

**Frontend:**
- React 18 with Vite
- Tailwind CSS
- React Router
- Axios
- React Query
- React Hot Toast

**Backend:**
- Node.js & Express
- MongoDB with Mongoose
- JWT Authentication
- bcrypt for password hashing
- CORS enabled
- Rate limiting

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd rental-management/backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update `.env` with your MongoDB connection string:
```
MONGODB_URI=mongodb://localhost:27017/rental-management
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=development
```

5. Seed the database with sample data:
```bash
npm run seed
```

6. Start the backend server:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd rental-management/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

## Test Accounts

After running the seed script, you can use these test accounts:

**Admin Account:**
- Email: `admin@rentalhub.com`
- Password: `admin123`

**Customer Account:**
- Email: `customer@example.com`
- Password: `customer123`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Bookings
- `GET /api/bookings` - Get bookings
- `GET /api/bookings/:id` - Get booking by ID
- `POST /api/bookings` - Create new booking
- `PUT /api/bookings/:id` - Update booking
- `POST /api/bookings/:id/confirm` - Confirm booking
- `POST /api/bookings/:id/cancel` - Cancel booking

### Payments
- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment
- `GET /api/payments/:id/status` - Get payment status

## Project Structure

```
rental-management/
├── backend/
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   ├── scripts/         # Utility scripts
│   ├── utils/           # Helper functions
│   └── server.js        # Express server
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── contexts/    # React contexts
│   │   └── main.jsx     # App entry point
│   ├── public/          # Static assets
│   └── index.html       # HTML template
└── README.md
```

## Development

### Backend Development
```bash
cd rental-management/backend
npm run dev  # Starts with nodemon for auto-reload
```

### Frontend Development
```bash
cd rental-management/frontend
npm run dev  # Starts Vite dev server
```

### Running Tests
```bash
# Backend tests
cd rental-management/backend
npm test

# Frontend tests
cd rental-management/frontend
npm test
```

## Deployment

### Backend Deployment
1. Set environment variables in production
2. Use a process manager like PM2
3. Set up reverse proxy with Nginx
4. Use MongoDB Atlas for database

### Frontend Deployment
1. Build the production bundle:
```bash
npm run build
```
2. Deploy to Vercel, Netlify, or serve static files

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
# SelvaTailor Backend API

A comprehensive Node.js/Express backend for the SelvaTailor tailoring booking application.

## Features

✅ **Authentication**
- JWT-based authentication
- Secure password hashing with bcryptjs
- Login/Register endpoints

✅ **Design Management**
- Create, read, update, delete designs
- Categorized design catalog
- Price and completion time tracking

✅ **Booking System**
- Customer appointment booking
- Time slot management
- Booking status tracking
- Estimated delivery calculation

✅ **Tailor Dashboard**
- Booking analytics
- Revenue tracking
- Design management
- Profile management

## Installation

### Prerequisites
- Node.js v14+
- MongoDB v4.4+
- npm or yarn

### Setup

1. **Clone and navigate to backend:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   ```

4. **Update .env with your values:**
   ```
   MONGODB_URI=mongodb://localhost:27017/selva-tailor
   PORT=5000
   JWT_SECRET=your_secret_key
   NODE_ENV=development
   CLIENT_URL=http://localhost:3000
   ```

5. **Start MongoDB:**
   ```bash
   mongod
   ```

6. **Run development server:**
   ```bash
   npm run dev
   ```

   Server will start at `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new tailor
- `POST /api/v1/auth/login` - Login tailor
- `GET /api/v1/auth/me` - Get current tailor (Protected)
- `POST /api/v1/auth/logout` - Logout (Protected)

### Designs
- `GET /api/v1/designs` - Get all designs
- `GET /api/v1/designs/:id` - Get single design
- `GET /api/v1/designs/tailor/:tailorId` - Get tailor's designs
- `POST /api/v1/designs` - Create design (Protected)
- `PUT /api/v1/designs/:id` - Update design (Protected)
- `DELETE /api/v1/designs/:id` - Delete design (Protected)

### Bookings
- `GET /api/v1/bookings` - Get all tailor's bookings (Protected)
- `GET /api/v1/bookings/:id` - Get single booking (Protected)
- `POST /api/v1/bookings` - Create booking
- `PUT /api/v1/bookings/:id/status` - Update booking status (Protected)
- `GET /api/v1/bookings/analytics/date-range` - Get bookings analytics (Protected)

### Tailors
- `GET /api/v1/tailors` - List all public tailors
- `GET /api/v1/tailors/profile/:id` - Get tailor profile
- `PUT /api/v1/tailors/profile/update` - Update profile (Protected)
- `GET /api/v1/tailors/stats/dashboard` - Get dashboard stats (Protected)

## Example Requests

### Register Tailor
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "loginId": "selvamani",
    "password": "Selva@123",
    "fullName": "Selvamani",
    "email": "selvamani@example.com",
    "phone": "+91-9876543210"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "loginId": "selvamani",
    "password": "Selva@123"
  }'
```

### Create Design (with token)
```bash
curl -X POST http://localhost:5000/api/v1/designs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "Classic Navy Suit",
    "description": "Italian wool, hand-stitched lapels",
    "price": 1200,
    "category": "Suit",
    "daysToComplete": 14
  }'
```

### Create Booking
```bash
curl -X POST http://localhost:5000/api/v1/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "John Doe",
    "customerPhone": "+1-234-567-8900",
    "customerEmail": "john@example.com",
    "customerAddress": "123 Main St, City",
    "designId": "DESIGN_ID_HERE",
    "bookingDate": "2024-12-25",
    "bookingTime": "10:00 AM"
  }'
```

## Database Schema

### Tailor
```javascript
{
  loginId: String (unique),
  password: String (hashed),
  fullName: String,
  email: String (unique),
  phone: String,
  shopName: String,
  address: Object,
  profilePicture: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Design
```javascript
{
  title: String,
  description: String,
  price: Number,
  category: String (enum: Suit, Dress, Traditional, etc.),
  daysToComplete: Number,
  imageUrl: String,
  imageType: String,
  tailor: ObjectId (ref: Tailor),
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Booking
```javascript
{
  customerName: String,
  customerPhone: String,
  customerEmail: String,
  customerAddress: String,
  design: ObjectId (ref: Design),
  tailor: ObjectId (ref: Tailor),
  bookingDate: Date,
  bookingTime: String,
  status: String (enum: confirmed, in-progress, completed, cancelled),
  notes: String,
  estimatedDelivery: Date,
  totalPrice: Number,
  createdAt: Date,
  updatedAt: Date
}
```

## Error Handling

All errors return appropriate HTTP status codes:
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Server Error

## Security Features

✅ JWT Token Authentication
✅ Password Hashing with bcryptjs
✅ CORS Protection
✅ Input Validation
✅ Authorization Checks
✅ Secure Error Messages

## Deployment

### Deploy to Heroku

1. Install Heroku CLI
2. Login: `heroku login`
3. Create app: `heroku create your-app-name`
4. Set environment variables:
   ```bash
   heroku config:set JWT_SECRET=your_secret
   heroku config:set MONGODB_URI=your_mongodb_uri
   ```
5. Deploy: `git push heroku main`

### Deploy to Railway/Render
Similar process with their respective CLIs and dashboards.

## Testing

```bash
npm test
```

## Support

For issues or questions, create a GitHub issue in the repository.

## License

MIT License - feel free to use this in your projects!

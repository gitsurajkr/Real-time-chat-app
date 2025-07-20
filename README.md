# EchoLine - Real-Time Chat App

A scalable real-time chat application built with **Node.js**, **Express**, **WebSocket**, **Redis Pub/Sub**, and **Next.js**.

---

## Features

- **Real-time messaging** with WebSocket connections
- **Smart user presence detection** with heartbeat system (15s intervals)
- **Automatic offline detection** after 30 seconds of inactivity
- **Scalable backend** using Redis Pub/Sub for horizontal scaling
- **Modern, responsive UI** optimized for mobile and desktop
- **Sticky chat interface** for better mobile experience
- **Auto-scroll messaging** with smooth animations
- **Join or create chat rooms** instantly with room ID sharing
- **No registration required** - just enter username and start chatting
- **Real-time user list** showing online/offline status and last seen

## Tech Stack

**Backend:**
- Node.js with TypeScript
- Express.js
- ws (WebSocket server)
- Redis (Pub/Sub for scaling WebSocket across instances)
- Real-time user presence tracking

**Frontend:**
- Next.js 14 (React framework)
- TypeScript
- Tailwind CSS for styling
- Radix UI components
- Lucide React icons
- Custom WebSocket hook for real-time communication

## Architecture Overview

```
Client (Next.js) <------ WebSocket ------> Node.js/Express Server <-----> Redis Pub/Sub
       |                                            |
   Heartbeat (15s)                          User Presence Tracking
   Auto-reconnect                           Offline Detection (30s)
```

**Key Features:**
- Each chat room is a Redis channel
- Heartbeat system maintains accurate user presence
- When a user sends a message, backend publishes to Redis
- All server instances subscribed to that room broadcast to connected clients
- Automatic user join/leave detection with WebSocket connection status
- Horizontal scaling support (multiple backend instances)

## Getting Started

### Prerequisites
- **Node.js** (v18+ recommended)
- **Redis server** (local or cloud - Redis Cloud, Upstash, etc.)
- **npm** or **yarn** package manager

### 1. Clone the repository

```bash
git clone https://github.com/gitsurajkr/Real-time-chat-app.git
cd real-time-chat-app
```

### 2. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Configure your Redis credentials in .env:
# REDIS_HOST=your-redis-host
# REDIS_PORT=your-redis-port
# REDIS_USERNAME=your-redis-username  
# REDIS_PASSWORD=your-redis-password

# Build and start the server
npm run build
npm run dev

# Backend runs on ws://localhost:8080
```

### 3. Setup Frontend

In a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Create environment file (optional)
echo "NEXT_PUBLIC_WS_URL=ws://localhost:8080" > .env.local

# Start the development server
npm run dev

# Frontend runs on http://localhost:3000
```

### 4. Redis Configuration

**Option 1: Local Redis**
```bash
# Install Redis locally
brew install redis        # macOS
sudo apt install redis    # Ubuntu

# Start Redis server
redis-server
```

**Option 2: Cloud Redis (Recommended)**
- Use Redis Cloud, Upstash, or AWS ElastiCache
- Update your `.env` file with cloud credentials

## Usage

1. **Open the app**: Navigate to [http://localhost:3000](http://localhost:3000)
2. **Enter details**: Provide a username and room ID 
3. **Join/Create room**: Click join to enter an existing room or create a new one
4. **Start chatting**: Send messages and see real-time responses
5. **Share room**: Copy the room ID to invite others
6. **Monitor presence**: See who's online, offline, and their last seen status

### Key Features in Action

- **Real-time messaging**: Messages appear instantly across all connected users
- **User presence**: Green dot = online, Gray dot = offline with "last seen" timestamp  
- **Heartbeat system**: Users stay online even when just reading (no need to send messages)
- **Mobile optimized**: Sticky header and input, responsive design with proper viewport handling
- **Auto-scroll**: New messages automatically scroll into view
- **Connection status**: WiFi icon shows connection state in header

## Performance & Scaling

### Horizontal Scaling
- **Multiple backend instances**: Run several backend servers behind a load balancer
- **Redis Pub/Sub**: Ensures all users receive messages regardless of which server they're connected to
- **Stateless design**: Each server instance can handle any user connection

### User Presence System
- **Heartbeat interval**: 15 seconds (configurable)
- **Offline detection**: 30 seconds without heartbeat (configurable)
- **Automatic cleanup**: Inactive users are marked offline and cleaned up
- **Reconnection handling**: Automatic reconnection with exponential backoff

### Example Production Setup
```bash
# Backend instances
Server 1: ws://backend1.yourapp.com:8080
Server 2: ws://backend2.yourapp.com:8080

# Load balancer routes WebSocket connections
# Redis cluster handles pub/sub at scale


## Environment Variables

### Backend (.env)
```env
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_USERNAME=your-username
REDIS_PASSWORD=your-password
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_WS_URL=ws://localhost:8080
```

##  Deployment

### Backend Deployment (Railway, Fly.io, etc.)
```bash
# Build for production
npm run build

# Start production server
npm start
```

### Frontend Deployment (Vercel, Netlify, etc.)
```bash
# Build for production
npm run build

# Set environment variables in your hosting platform
NEXT_PUBLIC_WS_URL=wss://your-backend-url.com
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- Built with modern web technologies
- Inspired by real-time communication needs


---
# Real-Time Chat App

🚀 A scalable real-time chat application built with **Node.js**, **Express**, **WebSocket**, **Redis Pub/Sub**, and **Next.js**.

---

## Features

- Real-time messaging with WebSocket
- Scalable backend using Redis Pub/Sub for horizontal scaling
- Modern, responsive UI with Next.js and Tailwind CSS
- Join or create chat rooms instantly
- No registration required

## Tech Stack

**Backend:**
- Node.js
- Express.js
- ws (WebSocket server)
- Redis (Pub/Sub for scaling WebSocket across instances)

**Frontend:**
- Next.js (React framework)
- Tailwind CSS
- Radix UI components

## Architecture Overview

```
Client (Next.js) <---- WebSocket ----> Node.js/Express Server <----> Redis Pub/Sub
```

- Each chat room is a Redis channel.
- When a user sends a message, the backend publishes it to Redis; all server instances subscribed to that room broadcast to their connected clients.
- This allows the app to scale horizontally (multiple backend instances can handle more users).

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- Redis server (local or cloud)

### 1. Clone the repository

```bash
git clone https://github.com/gitsurajkr/Real-time-chat-app.git
cd real-time-chat-app
```

### 2. Start the Backend

```bash
cd backend
npm install
npm run build
npm run dev
# The backend runs on ws://localhost:8080
```

### 3. Start the Frontend

In a new terminal:

```bash
cd frontend
npm install
npm run dev
# The frontend runs on http://localhost:3000
```

### 4. Configure Redis (if needed)
By default, the backend connects to Redis at `localhost:6379`. To use a different host/port, update the Redis connection in `backend/src/server.ts`.

## Usage

1. Open [http://localhost:3000](http://localhost:3000) in your browser.
2. Enter a room ID and username to join or create a chat room.
3. Start chatting in real time!

## Scaling

- To handle high traffic, run multiple backend server instances (e.g., behind a load balancer). Redis Pub/Sub ensures all users in a room receive messages, no matter which server instance they're connected to.

## Folder Structure

```
real-time-chat-app/
  backend/    # Node.js, Express, WebSocket, Redis
  frontend/   # Next.js, React, Tailwind CSS
```

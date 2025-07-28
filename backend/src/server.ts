import { WebSocketServer, WebSocket } from "ws";
import { randomUUID } from "crypto"
import { createClient } from "redis"
import * as dotenv from "dotenv"

dotenv.config();
const redisSubscribedRooms = new Set<string>();

const publishClient = createClient({
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST || "",
        port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : undefined
    }
});

const subscribeClient = createClient({
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST || "",
        port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : undefined
    }
});

publishClient.on('error', err => console.log('Redis Publish Client Error', err));
subscribeClient.on('error', err => console.log('Redis Subscribe Client Error', err));

publishClient.connect();
subscribeClient.connect();


const wss = new WebSocketServer({ port: 8080 });

const subscription: {
    [id: string]: {
        ws: WebSocket,
        rooms: string[];
        username?: string;
    }
} = {}

// Track user presence with heartbeat timestamps
const userPresence: {
    [roomId: string]: {
        [username: string]: {
            lastSeen: number;
            isOnline: boolean;
        }
    }
} = {}

wss.on("connection", function connection(ws) {
    const id = randomUUID();
    subscription[id] = {
        ws: ws,
        rooms: [],
        username: undefined
    }
    console.log(`[CONNECTED] user ${id}`);

    ws.on("message", async (data, isBinary) => {
       
        if(isBinary){
            
            const roomid = subscription[id].rooms[0];
            if(!roomid) return;

            Object.entries(subscription).forEach(([uid, { ws, rooms }]) => {
                if (rooms.includes(roomid) && ws.readyState === WebSocket.OPEN) {
                    ws.send(data); 
                }
            });
            return;
        }
         const parsedMessage = JSON.parse(data.toString())
        const type = parsedMessage.type;

        if (type === "SUBSCRIBE") {
            const room = parsedMessage.room;
            if (!subscription[id].rooms.includes(room)) {
                subscription[id].rooms.push(room)

            }
            if (atLeaseOneUserConnected(room)) {
                console.log("subscribing to pub sub to room: ", room)
                if(!redisSubscribedRooms.has(room)){
                    redisSubscribedRooms.add(room)
                    await subscribeClient.subscribe(room, (message) => {
                    const parsed = JSON.parse(message)
                    const { roomId, message: msg } = parsed

                    // broadcast to all useer in that particular room
                    Object.entries(subscription).forEach(([uid, { ws, rooms }]) => {
                        if (rooms.includes(roomId)) {
                            ws.send(JSON.stringify({
                                type: "RECEIVER_MESSAGE",
                                roomId,
                                message: msg
                            }))
                        }
                    })

                })
                }
                
            }
        }
        if (type === "UNSUBSCRIBE") {
            const room = parsedMessage.room
            subscription[id].rooms = subscription[id].rooms.filter((r) => r !== room);

            if (noOneIsConnected(room)) {
                console.log(`Unsubscribing from room ${room}`)
                await subscribeClient.unsubscribe(room)
                redisSubscribedRooms.delete(room)
            }
        }

        if (type === "sendMessage") {
            const roomId = parsedMessage.roomId
            const msg = parsedMessage.message

            await publishClient.publish(roomId,
                JSON.stringify({
                    type: "sendMessage",
                    roomId,
                    message: msg
                })
            )
        }

        // Handle user join events
        if (type === "USER_JOIN") {
            const roomId = parsedMessage.roomId;
            const username = parsedMessage.username;
            
            if (roomId && username) {
                subscription[id].username = username;
                
                // Initialize room presence if it doesn't exist
                if (!userPresence[roomId]) {
                    userPresence[roomId] = {};
                }
                
                // Mark user as online
                userPresence[roomId][username] = {
                    lastSeen: Date.now(),
                    isOnline: true
                };
                
                // Broadcast to other users in the room
                broadcastToRoom(roomId, {
                    type: "USER_JOINED",
                    roomId,
                    username
                });
                
                console.log(`User ${username} joined room ${roomId}`);
            }
        }

        if (type === "USER_LEAVE") {
            const roomId = parsedMessage.roomId;
            const username = parsedMessage.username;
            
            if (roomId && username && userPresence[roomId] && userPresence[roomId][username]) {
                userPresence[roomId][username].isOnline = false;
                userPresence[roomId][username].lastSeen = Date.now();
                
                broadcastToRoom(roomId, {
                    type: "USER_LEFT",
                    roomId,
                    username
                });
                
                console.log(`User ${username} left room ${roomId}`);
            }
        }

        // Handle heartbeat to keep user online
        if (type === "HEARTBEAT") {
            const roomId = parsedMessage.roomId;
            const username = parsedMessage.username;
            
            if (roomId && username) {
                if (!userPresence[roomId]) {
                    userPresence[roomId] = {};
                }
                
                const wasOffline = !userPresence[roomId][username]?.isOnline;
                
                // Update user's last seen timestamp and mark as online
                userPresence[roomId][username] = {
                    lastSeen: Date.now(),
                    isOnline: true
                };
                
                // If user was offline and now sending heartbeat, notify others they're back online
                if (wasOffline) {
                    broadcastToRoom(roomId, {
                        type: "USER_ONLINE",
                        roomId,
                        username
                    });
                    console.log(`User ${username} came back online in room ${roomId}`);
                }
            }
        }

        // Handle typing events
        if (type === "USER_TYPING") {
            const roomId = parsedMessage.roomId;
            const username = parsedMessage.username;
            
            if (roomId && username) {
                // Broadcast typing event to other users in the room (excluding sender)
                broadcastToRoom(roomId, {
                    type: "USER_TYPING",
                    roomId,
                    username
                }, id); // Pass sender's ID to exclude them
                
                console.log(`User ${username} is typing in room ${roomId}`);
            }
        }

        if (type === "USER_STOP_TYPING") {
            const roomId = parsedMessage.roomId;
            const username = parsedMessage.username;
            
            if (roomId && username) {
                // Broadcast stop typing event to other users in the room (excluding sender)
                broadcastToRoom(roomId, {
                    type: "USER_STOP_TYPING",
                    roomId,
                    username
                }, id); 
                
                console.log(`User ${username} stopped typing in room ${roomId}`);
            }
        }
    })

    ws.on("close", async () => {
    console.log(`[DISCONNECTED] user ${id}`);

    const userRooms = subscription[id].rooms;
    const username = subscription[id].username;
    
    // Mark user as offline in all rooms they were in
    if (username) {
        for (const roomId of userRooms) {
            if (userPresence[roomId] && userPresence[roomId][username]) {
                userPresence[roomId][username].isOnline = false;
                userPresence[roomId][username].lastSeen = Date.now();
                
                broadcastToRoom(roomId, {
                    type: "USER_LEFT",
                    roomId,
                    username
                });
            }
        }
    }
    
    delete subscription[id];

    for (const room of userRooms) {
        if (noOneIsConnected(room)) {
            console.log(`Unsubscribing from room ${room} (after disconnect)`);
            await subscribeClient.unsubscribe(room);
            redisSubscribedRooms.delete(room)
        }
    }
});

})

function broadcastToRoom(roomId: string, message: any, excludeId?: string) {
    Object.entries(subscription).forEach(([uid, { ws, rooms }]) => {
        if (rooms.includes(roomId) && ws.readyState === WebSocket.OPEN && uid !== excludeId) {
            ws.send(JSON.stringify(message));
        }
    });
}

setInterval(() => {
    const now = Date.now();
    const OFFLINE_THRESHOLD = 30000; // 30 seconds
    
    Object.keys(userPresence).forEach(roomId => {
        Object.keys(userPresence[roomId]).forEach(username => {
            const user = userPresence[roomId][username];
            
            if (user.isOnline && (now - user.lastSeen) > OFFLINE_THRESHOLD) {
                user.isOnline = false;
                user.lastSeen = now;
                
                // Broadcast that user went offline
                broadcastToRoom(roomId, {
                    type: "USER_OFFLINE",
                    roomId,
                    username
                });
                
                console.log(`User ${username} marked offline in room ${roomId} due to inactivity`);
            }
        });
    });
}, 30000);


function atLeaseOneUserConnected(roomid: string) {
    return Object.values(subscription).some(sub => sub.rooms.includes(roomid))
}

function noOneIsConnected(roomId: string) {
   return !Object.values(subscription).some(sub => sub.rooms.includes(roomId))
}



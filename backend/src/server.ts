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
    }
} = {}

wss.on("connection", function connection(ws) {
    const id = randomUUID();
    subscription[id] = {
        ws: ws,
        rooms: []
    }
    console.log(`[CONNECTED] user ${id}`);

    ws.on("message", async (data) => {
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
    })

    ws.on("close", async () => {
    console.log(`[DISCONNECTED] user ${id}`);

    const userRooms = subscription[id].rooms;
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


function atLeaseOneUserConnected(roomid: string) {
    return Object.values(subscription).some(sub => sub.rooms.includes(roomid))
}

function noOneIsConnected(roomId: string) {
   return !Object.values(subscription).some(sub => sub.rooms.includes(roomId))
}
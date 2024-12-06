import { createClient } from 'redis';

(async () => {
    const redisSubscriber = createClient({
        url: process.env.REDIS_URL,
    });

    redisSubscriber.on('error', (err) => console.error('Redis Subscriber Error', err));

    await redisSubscriber.connect();

    await redisSubscriber.subscribe('messages', (message) => {
        console.log('Received message:', message);
        // TODO: Process the message as needed

    });
})();

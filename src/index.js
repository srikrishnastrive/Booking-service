const express = require('express');
const amqplib = require('amqplib');

async function connectQueue(){
    try {
        const connection = await amqplib.connect('amqp://localhost');
        const channel = await connection.createChannel();
        await channel.assertQueue('noti-queue');
        setInterval(()=>{
            channel.sendToQueue("noti-queue",Buffer.from("this is krishna"));
        },1000);
       

    } catch (error) {
        console.log(error);
    }
}

const { ServerConfig } = require('./config');
const apiRoutes = require('./routes');
const CRON = require('./utils/common/cron-jobs');

const app = express();


app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use('/api', apiRoutes);
app.use('/bookingService/api',apiRoutes);

app.listen(ServerConfig.PORT, async () => {
    console.log(`Successfully started the server on PORT : ${ServerConfig.PORT}`);
    CRON();
    await connectQueue();
    console.log('queue is up');
});

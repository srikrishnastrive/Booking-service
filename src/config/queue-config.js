const amqplib = require('amqplib');

async function connectQueue(){
    try {
        const connection = await amqplib.connect('amqp://localhost');
        const channel = await connection.createChannel();
        await channel.assertQueue('noti-queue');
        // setInterval(()=>{
        //     channel.sendToQueue("noti-queue",Buffer.from("this is krishna"));
        // },1000);
       

    } catch (error) {
        console.log(error);
    }
}

async function sendData(data){
    try {
        const connection = await amqplib.connect('amqp://localhost');
        const channel = await connection.createChannel();
        await channel.sendToQueue("noti-queue",Buffer.from(JSON.stringify(data)));
    } catch (error) {
        console.log(error);
    }
}

module.exports = {connectQueue,sendData};
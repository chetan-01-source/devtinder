const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'user-post-service',
  brokers: [process.env.KAFKA_BROKERS || 'localhost:9092']// your Docker host broker
});

const producer = kafka.producer();
const connectKafka = async () => {

    try{
        await producer.connect();
  console.log('Kafka Producer connected');

    }
    catch (error) {
        console.error('Error connecting to Kafka:', error);
        throw error; // Re-throw the error to handle it in the calling function
    }
  
};
const sendMessage = async (topic, message) => {
  await producer.send({
    topic,
    messages: [{ value: JSON.stringify(message) }],
  });
    console.log(`[Kafka] Event published to topic "${topic}":`, message);
};

module.exports = {
  connectKafka,
  sendMessage
};
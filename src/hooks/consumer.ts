import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'cement-telemetry-consumer',
  brokers: [process.env.BOOTSTRAP_SERVER!],
  ssl: true,
  sasl: {
    mechanism: 'plain',
    username: process.env.API_KEY!,
    password: process.env.API_SECRET!,
  },
});

export const consumer = kafka.consumer({
  groupId: 'cement-dashboard-group',
});

export async function startConsumer(onMessage: (data: any) => void) {
  await consumer.connect();
  await consumer.subscribe({
    topic: 'cement.telemetry',
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const data = JSON.parse(message.value!.toString());
      onMessage(data);
    },
  });
}

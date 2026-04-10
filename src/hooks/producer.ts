import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'cement-telemetry-producer',
  brokers: [process.env.BOOTSTRAP_SERVER!],
  ssl: true,
  sasl: {
    mechanism: 'plain',
    username: process.env.API_KEY!,
    password: process.env.API_SECRET!,
  },
});

export const producer = kafka.producer();

export async function sendTelemetry(data: any) {
  await producer.connect();

  await producer.send({
    topic: 'cement.telemetry',
    messages: [
      {
        key: 'plant-1',
        value: JSON.stringify(data),
      },
    ],
  });
}

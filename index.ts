import { KafkaConsumer, KafkaProducer } from "./kafka";
import { Kafka, logLevel } from "kafkajs";

let instance, consumer, producer;

const errorTypes = ["unhandledRejection", "uncaughtException"];

errorTypes.map((type) => {
  process.on(type, async (e) => {
    try {
      console.log(`process.on ${type}`);
      console.error(e);
      await consumer.disconnect();
      process.exit(0);
    } catch (_) {
      process.exit(1);
    }
  });
});

Object.values<NodeJS.Signals>(["SIGHUP", "SIGINT", "SIGTERM"]).map((type) => {
  process.once(type, async () => {
    try {
      await consumer.disconnect();
    } finally {
      process.kill(process.pid, type);
    }
  });
});

export default (options) => {
  if (instance) {
    return instance;
  }

  const {
    consumerConfig,
    producerConfig,
    client = new Kafka({
      logLevel: logLevel.ERROR,
      brokers: [options.kafkaHost],
      clientId: options.serviceId,
      ssl: options.ssl || false,
      sasl: options.sasl,
    }),
    ...rest
  } = options;

  consumer = consumerConfig
    ? new KafkaConsumer({
        ...consumerConfig,
        client,
        ...rest,
      })
    : {};

  producer = producerConfig
    ? new KafkaProducer({
        ...producerConfig,
        client,
        ...rest,
      })
    : {};

  instance = {
    consumer,
    producer,
  };

  return instance;
};

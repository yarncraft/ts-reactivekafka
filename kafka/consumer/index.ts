import { Kafka, Consumer, IHeaders } from "kafkajs";
import { Subject } from "rxjs";

import { logging, generator } from "../../helpers";
import kafkaConfig from "../../config";

export type Event = {
  key?: string | null;
  value: any;
  partition?: number;
  headers?: IHeaders;
  timestamp?: string;
};

export default class KafkaConsumer {
  consumerSubject: Subject<{
    topic: string;
    message: Event;
  }>;
  client: Kafka;
  consumer: Consumer;
  topics: string[];
  consumerGroupId: string;
  consumerId: string;
  logAllEvents: boolean;

  constructor(options) {
    this.logAllEvents = options.logAllEvents;
    this.consumerGroupId = options.consumerGroupId;
    this.consumerId = options.consumerId;
    this.topics = options.topics;
    this.consumerSubject = new Subject();
    this.client = options.client;
    this.consumer = this.client.consumer({
      groupId:
        this.consumerGroupId ||
        `${this.consumerId}-${process.pid
        }-${new Date().getTime()}-${generator.generateUuid()}`, //eslint-disable-line max-len
      maxBytesPerPartition:
        options.maxBytesPerPartition || kafkaConfig.maxBytesPerPartition,
      maxWaitTimeInMs: options.maxWaitInTimeInMs || kafkaConfig.maxWaitTimeInMs,
      metadataMaxAge: options.metadataMaxAge || kafkaConfig.metadataMaxAge,
    });

    (async () => {
      try {
        await this.consumer.connect();
      } catch (e0) {
        try {
          logging.error(`Error during connect: ${e0}`);
          logging.error("Retrying to connect");
          await this.consumer.connect();
        } catch (e1) {
          logging.error(`Error during final connect attempt: ${e1}`);
          process.exit(1);
        }
      }
    })();

    this.topics.map((topic) => this.subscribe(topic));
  }

  private async subscribe(topic) {
    try {
      await this.consumer.subscribe({ topic });
    } catch (e0) {
      try {
        logging.error(`Error during subscribing:
				${e0}`);
        logging.error("Retrying subscribing");
        await this.consumer.subscribe({ topic });
      } catch (e1) {
        logging.error(`Error during final subscribe attempt:
				${e1}`);
        process.exit(1);
      }
    }

    logging.report("Consumer has started processing messages");

    try {
      await this.consumer.run({
        autoCommitInterval: kafkaConfig.autoCommitInterval,
        eachMessage: async ({ topic, partition, message }) => {
          if (message && topic) {
            try {
              let payload: any
              try { payload = JSON.parse(message.value.toString()); }
              catch (err) {
                payload = message.value.toString()
              }
              const key = message.key.toString();
              const headers = message.headers;

              this.sendUpdateToObservers({
                topic,
                message: {
                  key,
                  partition,
                  value: payload,
                  headers,
                },
              });

              if (this.logAllEvents) {
                logging.report({
                  topic,
                  message: {
                    key,
                    value: payload,
                    headers,
                    partition,
                  },
                });
              }
            } catch (error) {
              logging.error(error);
            }
          }
        },
      });
    } catch (e) {
      logging.error(`error during processing message (Terminating):${e}`);
      process.exit(1);
    }
  }

  private sendUpdateToObservers({ topic, message }) {
    this.consumerSubject.next({ topic, message });
  }

  getSubject() {
    return this.consumerSubject;
  }

  async disconnect() {
    await this.consumer.disconnect()
    this.consumerSubject.complete()
  }
}

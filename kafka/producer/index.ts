import { Kafka, Producer } from "kafkajs";
import { Subject } from "rxjs";

import kafkaConfig from "../../config";
import { Event } from "../consumer"
import { logging } from "../../helpers";



export default class KafkaProducer {
	producerSubject: Subject<{ topic: string, message: Event }>;
	topics: string[];
	client: Kafka;
	producer: Producer;

	constructor(options) {
		this.topics = options.topics;
		this.producerSubject = new Subject();
		this.client = options.client
		this.producer = this.client.producer({
			metadataMaxAge: kafkaConfig.metadataMaxAge,
		});

		this.initProducer();
	}

	getSubject() {
		return this.producerSubject;
	}

	private initProducer() {
		(async () => {
			try {
				await this.producer.connect();
			} catch (e0) {
				try {
					logging.error(`Error during connect: ${e0}`);
					logging.error("Retrying to connect");
					await this.producer.connect();
				} catch (e1) {
					logging.error(`Error during final connect attempt: ${e1}`);
					process.exit(1);
				}
			}
		})();


		this.producerSubject.subscribe(({ message }) => {
			let { value, ...rest } = message;
			this.topics.map(
				async (topic) =>
					await this.producer.send({
						topic: topic,
						messages: [{ value: JSON.stringify(value), ...rest }],
					})
			);
		});
	}
}

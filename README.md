<div align="center">
<h1> ts-reactivekafka </h1>

_Typesafe & reactive Kafka Subjects made with Typescript, KafkaJS and RxJS._

<img src="./banner.png" width="250">
</div>

## Quickstart

```sh
npm i ts-reactivekafka
```

_single consumer_

```typescript
import rxkafka from "ts-reactivekafka";
import { tap } from "rxjs/operators";

(async () => {
	let kafkaConfig = {
		kafkaHost: process.env.KAFKA_HOST || "url:9092",
		serviceId: "test",
		logAllEvents: false,
		ssl: true,
		sasl: {
			mechanism: "plain",
			username: process.env.KAFKA_USER || "xxuser",
			password: process.env.KAFKA_PASS || "xxapitoken",
		},
	};

	// singleton is instantiated
	rxkafka({
		...kafkaConfig,
		consumerConfig: {
			topics: ["topicA", "topicB", "topicC"],
			consumerId: "testConsumer",
		},
		producerConfig: {
			topics: ["target"],
		},
	});

	// NOTE: multiple invocations of rxkafka result in the original singleton
	let kafka = rxkafka();

	kafka.consumer
		.getSubject()
		.pipe(
			tap((event) => console.log(event.message)) // rxjs operators
		)
		.subscribe(kafka.producer.getSubject());
})();
```

_consumer group with [dynamic import](https://mariusschulz.com/blog/dynamic-import-expressions-in-typescript)_

```typescript
import { merge } from "rxjs";

(async () => {
	const kafkaConfig = {
		kafkaHost: process.env.KAFKA_HOST || "url:9092",
		serviceId: "test",
		logAllEvents: false,
		ssl: true,
		sasl: {
			mechanism: "plain",
			username: process.env.KAFKA_USER || "xxuser",
			password: process.env.KAFKA_PASS || "xxapitoken",
		},
	};

	const kafkaProducerSingleton = (await import("ts-reactivekafka"))({
		...kafkaConfig,
		producerConfig: {
			topics: ["target"],
		},
	});

	const kafkaGroupConsumer1 = (await import("ts-reactivekafka"))({
		...kafkaConfig,
		consumerConfig: {
			topics: ["topicA", "topicB", "topicC"],
			consumerGroupId: "consumerGroupX", // NOTE: consumerGroupId instead of consumerId
		},
	});

	const kafkaGroupConsumer2 = (await import("ts-reactivekafka"))({
		...kafkaConfig,
		consumerConfig: {
			topics: ["topicA", "topicB", "topicC"],
			consumerGroupId: "consumerGroupX",
		},
	});

	const kafkaGroupConsumer3 = (await import("ts-reactivekafka"))({
		...kafkaConfig,
		consumerConfig: {
			topics: ["topicA", "topicB", "topicC"],
			consumerGroupId: "consumerGroupX",
		},
	});

	const consumerGroup = merge(
		kafkaGroupConsumer1.consumer.getSubject(),
		kafkaGroupConsumer2.consumer.getSubject(),
		kafkaGroupConsumer3.consumer.getSubject()
	);

	consumerGroup.subscribe(kafkaProducerSingleton.producer.getSubject());
})();
```

## The Code

The code follows a Singleton Pattern\* in which an optional consumer and producer instance are made available given the respective consumer and producer configurations and given a general Kafka config. The consumer or producer instance is only instantiated when their respective configs are well-defined.

The only public methods for both instances are:

- _getSubject()_ which returns the RxJs Subject (a multicasted observable)
- _disconnect()_ which disconnects the Kafka consumer/producer and completes the subject

The subjects are typed as follows:

```typescript
type Event = {
	key?: string | null
	value: any
	partition?: number
	headers?: IHeaders
	timestamp?: string
}

Subject<{topic: string, message: Event}>
```

Since, in Typescript, no basic JSON type exists _yet_ the value is typed as any. Otherwise value could have been typed as `JSON | string`.

## Reactive Operators

RxJs offers a vast range operators in which developers can construct fast & flexible functionally reactive programming constructs.
A good overview of the operators can be found here:

- https://www.learnrxjs.io/learn-rxjs/operators
- https://rxmarbles.com/

## Optimized module thanks to Vercel Ncc

[Vercel's ncc](https://github.com/vercel/ncc) provides NPM developers with the ultimate NPM module compilation toolkit:

- Publish minimal packages to npm
- Only ship relevant app code to serverless environments
- Don't waste time configuring bundlers
- Generally faster bootup time and less I/O overhead
- Compiled language-like experience (e.g.: go)

## Sponsored by Charp

This package is used in production and maintained by the developers of [Charp](https://artcare.be/).

<img src="https://wms.cs.kuleuven.be/cs/studeren/master-computerwetenschappen/stages/stagevoorstellen/logos-2020/logo-charp/@@images/image/preview
" width="250">

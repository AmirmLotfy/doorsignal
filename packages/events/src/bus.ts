import { DomainEvent, EventTopic } from './topics';

export type EventHandler<T = any> = (event: DomainEvent<T>) => Promise<void> | void;

export class EventBus {
  private static instance: EventBus;
  private handlers = new Map<EventTopic, Set<EventHandler>>();

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  public subscribe<T = any>(topic: EventTopic, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(topic)) {
      this.handlers.set(topic, new Set());
    }
    const topicHandlers = this.handlers.get(topic)!;
    topicHandlers.add(handler);

    return () => {
      topicHandlers.delete(handler);
    };
  }

  public async publish<T = any>(topic: EventTopic, data: T, source: string = 'doorsignal.local'): Promise<DomainEvent<T>> {
    const event: DomainEvent<T> = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      topic,
      source,
      timestamp: new Date().toISOString(),
      data
    };

    const topicHandlers = this.handlers.get(topic);
    if (topicHandlers) {
      const promises = Array.from(topicHandlers).map((handler) => {
        try {
          return Promise.resolve(handler(event));
        } catch (err) {
          console.error(`Error in event handler for topic ${topic}:`, err);
          return Promise.resolve();
        }
      });
      await Promise.all(promises);
    }

    return event;
  }
}

export const eventBus = EventBus.getInstance();

declare module 'ics' {
  export interface EventAttributes {
    title: string;
    start: [number, number, number, number, number] | [number, number, number];
    duration?: {
      days?: number;
      hours?: number;
      minutes?: number;
    };
    description?: string;
    status?: 'TENTATIVE' | 'CONFIRMED' | 'CANCELLED';
    busyStatus?: 'FREE' | 'BUSY' | 'TENTATIVE' | 'OOF';
    // Add any other properties you might use from the library
  }

  export interface NodeCallback {
    (error: Error | undefined, value: string): void
  }

  export function createEvent(
    attributes: EventAttributes,
    callback: NodeCallback
  ): void;
  
  export function createEvents(
    events: EventAttributes[],
  ): { error?: Error, value?: string };
}
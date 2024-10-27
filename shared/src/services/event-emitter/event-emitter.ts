/**
 * A simple class for creating events
 */
export class EventEmitter<T> {
  listeners: Array<(value: T) => void> = [];

  /**
   * Subscribe to the event
   * @param listener - Function to execute when the event occurs
   * @returns A function to unsubscribe from the event
   */
  public subscribe(listener: (value: T) => void): () => void {
    this.listeners.push(listener);

    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Unsubscribe from the event
   * @param listener - The function to unsubscribe
   */
  public unsubscribe(listener: (value: T) => void) {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  /**
   * Emit the event to all subscribers
   * @param value - Data to send to subscribers
   */
  public emit(value: T) {
    this.listeners.forEach((listener) => listener(value));
  }
}

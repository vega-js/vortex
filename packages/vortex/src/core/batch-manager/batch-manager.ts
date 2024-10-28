export class BatchManager {
  private isBatching = false;

  private batchedTasks = new Set<() => void>();

  public addTask(task: () => void) {
    this.batchedTasks.add(task);
    this.batchUpdates();
  }

  private batchUpdates() {
    if (!this.isBatching) {
      this.isBatching = true;

      Promise.resolve().then(() => {
        this.triggerBatchedTasks();
        this.isBatching = false;
      });
    }
  }

  private triggerBatchedTasks() {
    this.batchedTasks.forEach((task) => task());
    this.batchedTasks.clear();
  }
}

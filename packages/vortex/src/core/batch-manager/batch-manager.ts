export class BatchManager {
  private isBatching = false;

  private batchedTasks: (() => void)[] = [];

  public addTask(task: () => void) {
    this.batchedTasks.push(task);
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
    const tasksToRun = this.batchedTasks.slice();

    this.batchedTasks.length = 0;

    tasksToRun.forEach((task) => {
      task();
    });
  }
}

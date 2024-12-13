import fs from 'fs';
import path from 'path';
import Logger from './Logger';

export class DataStore<T> {
  private static instances = new Map<string, DataStore<any>>();
  private static saveQueues = new Map<string, unknown[][]>();
  private static isSaving = false;
  
  private data: T[] = [];
  private readonly filePath: string;
  private readonly dirPath: string;

  private constructor(type: string) {
    Logger.debug(`Initializing DataStore for type: ${type}`);
    this.dirPath = path.join(__dirname, '..', 'data');
    this.filePath = path.join(this.dirPath, `${type}.json`);
    this.ensureDirectoryExists();
    this.loadData();
    Logger.debug(`DataStore initialized for type: ${type}`);
  }

  static getInstance<U>(type: string): DataStore<U> {
    if (!this.instances.has(type)) {
      this.instances.set(type, new DataStore<U>(type));
    }
    return this.instances.get(type) as DataStore<U>;
  }

  private getSaveQueue(): T[][] {
    const queue = DataStore.saveQueues.get(this.filePath) as T[][] || [];
    if (!DataStore.saveQueues.has(this.filePath)) {
      DataStore.saveQueues.set(this.filePath, queue);
    }
    return queue;
  }

  private ensureDirectoryExists(): void {
    if (!fs.existsSync(this.dirPath)) {
      Logger.debug(`Creating directory: ${this.dirPath}`);
      fs.mkdirSync(this.dirPath, { recursive: true });
      Logger.debug(`Directory created: ${this.dirPath}`);
    }
  }

  private loadData(): void {
    try {
      Logger.debug(`Loading data from: ${this.filePath}`);
      if (fs.existsSync(this.filePath)) {
        const fileContent = fs.readFileSync(this.filePath, 'utf-8');
        this.data = JSON.parse(fileContent);
        Logger.debug(`Loaded ${this.data.length} items`);
      } else {
        Logger.debug('File not found, initializing empty data array');
        this.data = [];
        this.saveData();
      }
    } catch (error) {
      Logger.error(`Failed to load data: ${error}`);
      this.data = [];
    }
  }

  private saveData(): void {
    const queue = this.getSaveQueue();
    queue.push([...this.data]);
    this.processSaveQueue();
  }

  private async processSaveQueue(): Promise<void> {
    if (DataStore.isSaving) {
      Logger.debug('Save queue already processing');
      return;
    }
    
    DataStore.isSaving = true;
    Logger.debug('Processing save queue');
    
    try {
      for (const [filePath, dataQueue] of DataStore.saveQueues.entries()) {
        if (dataQueue.length === 0) continue;
        
        Logger.debug(`Saving ${dataQueue.length} queued changes to ${filePath}`);
        const latestData = dataQueue[dataQueue.length - 1];
        await fs.promises.writeFile(filePath, JSON.stringify(latestData, null, 2));
        DataStore.saveQueues.set(filePath, []);
        Logger.debug(`Saved changes to ${filePath}`);
      }
    } catch (error) {
      Logger.error(`Failed to process save queue: ${error}`);
    } finally {
      DataStore.isSaving = false;
      
      if ([...DataStore.saveQueues.values()].some(queue => queue.length > 0)) {
        setTimeout(() => this.processSaveQueue(), 100);
      }
    }
  }

  getAll(): T[] {
    Logger.debug('Getting all items');
    return [...this.data];
  }

  getById(id: string | number): T | undefined {
    Logger.debug(`Getting item by id: ${id}`);
    const item = this.data.find((item: any) => item.id === id);
    if (!item) Logger.debug(`Item not found with id: ${id}`);
    return item;
  }

  create(item: T): T {
    Logger.debug('Creating new item');
    this.data.push(item);
    this.saveData();
    Logger.debug('Item created successfully');
    return item;
  }

  update(id: string | number, updateData: Partial<T>): T | undefined {
    Logger.debug(`Updating item ${id}`);
    const index = this.data.findIndex((item: any) => item.id === id);
    if (index === -1) {
      Logger.warn(`Update failed: Item not found with id: ${id}`);
      return undefined;
    }

    this.data[index] = { ...this.data[index], ...updateData };
    this.saveData();
    Logger.debug(`Item ${id} updated successfully`);
    return this.data[index];
  }

  delete(id: string | number): boolean {
    Logger.debug(`Deleting item: ${id}`);
    const initialLength = this.data.length;
    this.data = this.data.filter((item: any) => item.id !== id);
    this.saveData();
    const success = initialLength !== this.data.length;
    if (success) {
      Logger.ready(`Item ${id} deleted successfully`);
    } else {
      Logger.warn(`Delete failed: Item not found with id: ${id}`);
    }
    return success;
  }
}
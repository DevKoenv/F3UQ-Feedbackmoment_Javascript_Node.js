import fs from 'fs';
import path from 'path';
import Logger from './Logger';

type QueueItem<T> = {
  filePath: string;
  data: T[];
  timestamp: number;
};

export class DataStore<T> {
  private static instances = new Map<string, DataStore<any>>();
  private static globalSaveQueue = new Map<string, QueueItem<any>>();
  private static isSaving = false;
  private static globalSyncInterval: NodeJS.Timer | null = null;
  private static syncIntervalMs = 5000;
  private static activeInstances = new Set<DataStore<any>>();

  private data: T[] = [];
  private readonly filePath: string;
  private readonly dirPath: string;
  private readonly enableAutoSync: boolean;

  private constructor(type: string, options: { syncIntervalMs?: number; enableAutoSync?: boolean } = {}) {
    const { syncIntervalMs = 5000, enableAutoSync = true } = options;
    
    DataStore.syncIntervalMs = syncIntervalMs;
    this.enableAutoSync = enableAutoSync;
    
    Logger.debug(`Initializing DataStore for type: ${type}`);
    this.dirPath = path.join(__dirname, '..', 'data');
    this.filePath = path.join(this.dirPath, `${type}.json`);
    
    this.ensureDirectoryExists();
    this.loadData();
    
    if (this.enableAutoSync) {
      DataStore.startGlobalSync(this);
    }
    
    Logger.debug(`DataStore initialized for type: ${type}`);
  }

  static getInstance<U>(type: string, options?: { syncIntervalMs?: number; enableAutoSync?: boolean }): DataStore<U> {
    if (!this.instances.has(type)) {
      this.instances.set(type, new DataStore<U>(type, options));
    }
    return this.instances.get(type) as DataStore<U>;
  }

  private static startGlobalSync(instance: DataStore<any>): void {
    this.activeInstances.add(instance);
    
    if (!this.globalSyncInterval) {
      this.globalSyncInterval = setInterval(() => {
        Logger.debug('Global sync triggered');
        for (const store of this.activeInstances) {
          store.loadData();
          this.processGlobalQueue();
        }
      }, this.syncIntervalMs);
      
      Logger.debug(`Global sync started with interval: ${this.syncIntervalMs}ms`);
    }
  }

  private static stopGlobalSync(instance: DataStore<any>): void {
    this.activeInstances.delete(instance);
    
    if (this.activeInstances.size === 0 && this.globalSyncInterval) {
      clearInterval(this.globalSyncInterval);
      this.globalSyncInterval = null;
      Logger.debug('Global sync stopped - no active instances');
    }
  }

  private static async processGlobalQueue(): Promise<void> {
    if (this.isSaving || this.globalSaveQueue.size === 0) return;
    
    this.isSaving = true;
    
    try {
      const promises = Array.from(this.globalSaveQueue.entries()).map(async ([filePath, queueItem]) => {
        await fs.promises.writeFile(filePath, JSON.stringify(queueItem.data, null, 2));
        this.globalSaveQueue.delete(filePath);
      });

      await Promise.all(promises);
    } catch (error) {
      Logger.error(`Failed to process global queue: ${error}`);
    } finally {
      this.isSaving = false;
    }
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
    DataStore.globalSaveQueue.set(this.filePath, {
      filePath: this.filePath,
      data: [...this.data],
      timestamp: Date.now()
    });
    DataStore.processGlobalQueue();
  }

  public stopAutoSync(): void {
    if (this.enableAutoSync) {
      DataStore.stopGlobalSync(this);
      Logger.debug(`Auto-sync disabled for ${this.filePath}`);
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

  public dispose(): void {
    this.stopAutoSync();
    if (DataStore.instances.has(this.filePath)) {
      DataStore.instances.delete(this.filePath);
    }
    DataStore.globalSaveQueue.delete(this.filePath);
    Logger.debug(`DataStore disposed for: ${this.filePath}`);
  }
}

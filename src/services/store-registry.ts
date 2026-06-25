import {BattleStateStore} from "../stores/battleStateStore";
import {getRedis} from "../lib/redis-client";

export const stores = {
  BattleStateStore: {
    class: BattleStateStore,
    key: 'battle'
  },
}

export class StoreRegistry {
  private static stores: Map<string, any> = new Map();

  static async init(): Promise<void> {
    const redis = getRedis();

    // logger.log('StoreClass');

    for (const {class: StoreClass, key} of Object.values(stores)) {
      // logger.log(StoreClass);
      // logger.log(key);
      const storeObj = new StoreClass(redis);
      this.addStore(key, storeObj);
    }


    await this.loadAll();
  }

  static getStores(): Map<string, any> {
    return this.stores;
  }

  static addStore(name: string, store: any) {
    this.stores.set(name, store);
  }

  static getStore<T>(name: string): T | undefined {
    return this.stores.get(name);
  }

  static async loadAll(): Promise<void> {
    for (const store of this.stores.values()) {
      if (typeof store.loadAll === "function") {
        await store.loadAll();
      }
    }
  }

  static async shutdown(): Promise<void> {
    for (const store of this.stores.values()) {
      if (typeof store.shutdown === "function") {
        await store.shutdown();
      }
    }
  }
}

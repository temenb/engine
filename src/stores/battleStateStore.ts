import Redis from "ioredis";
import {BattleObject} from "../grpc/generated/battle";

export class BattleStateStore {
  private redis: Redis;
  private cache: Map<string, BattleObject> = new Map();

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async loadAll(): Promise<void> {
    const keys = await this.redis.keys("battle:*");
    for (const key of keys) {
      const state = await this.redis.get(key);
      if (state) {
        const battle: BattleObject = JSON.parse(state);
        this.cache.set(battle.id, battle);
      }
    }
    console.log(`✅ Loaded ${this.cache.size} battles from Redis`);
  }

  get(battleId: string): BattleObject | undefined {
    return this.cache.get(battleId);
  }

  async set(battle: BattleObject): Promise<void> {
    this.cache.set(battle.id, battle);
    await this.redis.set(`battle:${battle.id}`, JSON.stringify(battle));
  }

  async remove(battleId: string): Promise<void> {
    this.cache.delete(battleId);
    await this.redis.del(`battle:${battleId}`);
  }

  async shutdown(): Promise<void> {
    await this.redis.quit();
  }
}

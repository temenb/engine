import {kafkaProducersConfig} from "../config/kafka.config";
import {StoreRegistry, stores} from "./store-registry";
import * as battleGrpc from "../grpc/generated/battle";
import * as engineGrpc from "../grpc/generated/engine";
import {BattleStateStore} from "../stores/battleStateStore";
import {enqueueEvent} from "@shared/pg-boss/src/enqueueEvent";
import logger from "@shared/logger";

export function battleStore(): BattleStateStore {
  // убедимся, что сторы инициализированы
  const battleStore = StoreRegistry.getStore<BattleStateStore>(stores.BattleStateStore.key);

  if (!battleStore) {
    throw new Error("BattleStateStore not found");
  }

  return battleStore;
}

export const battleNew = async (battle: battleGrpc.BattleObject) => {
  // logger.log('New battle started', battle)
  battle.cells = Array(9).fill(battleGrpc.BattleCellValue.CELL_EMPTY);
  battle.status = battleGrpc.BattleStatus.ACTIVE;
  battle.winner = "";

  await battleStore().set(battle);
  await enqueueEvent(kafkaProducersConfig.topicBattleUpdated, battle);

  return battle;

};

function getSymbolForUser(battle: battleGrpc.BattleObject, move: engineGrpc.BattleMoveRequest): battleGrpc.BattleCellValue {
  const idx = battle.players.indexOf(move.profileId);
  if (idx === -1) throw new Error("User is not found in the battle");

  return idx === 0 ? battleGrpc.BattleCellValue.CELL_X : battleGrpc.BattleCellValue.CELL_O;
}

function verifyTurn(battle: battleGrpc.BattleObject, move: engineGrpc.BattleMoveRequest) {
  // logger.log(move.profileId);
  // logger.log(turn(battle));
  // logger.log(battle.players[turn(battle)]);
  if (move.profileId != battle.players[turn(battle)]) {
    throw new Error(`Not your turn`);
  }
}

function turn(battle: battleGrpc.BattleObject) {
  return battle.cells.filter(
    cell => cell !== battleGrpc.BattleCellValue.CELL_EMPTY
  ).length % battle.players.length;
}

function verifyCell(battle: battleGrpc.BattleObject, move: engineGrpc.BattleMoveRequest) {
  if (battle.cells[move.cellIdx] != battleGrpc.BattleCellValue.CELL_EMPTY) {
    throw new Error(`Cell is not empty`);
  }
}

function isWin(battle: battleGrpc.BattleObject): boolean {
  const winningCombos = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  for (const [a, b, c] of winningCombos) {
    if (
      battle.cells[a] !== battleGrpc.BattleCellValue.CELL_EMPTY &&
      battle.cells[a] === battle.cells[b] &&
      battle.cells[a] === battle.cells[c]
    ) {
      return true;
    }
  }
  return false;
}

function isDraw(battle: battleGrpc.BattleObject): boolean {
  return !battle.cells.includes(battleGrpc.BattleCellValue.CELL_EMPTY);
}

export const makeMove = async (move: engineGrpc.BattleMoveRequest) => {
  const battle = await battleStore().get(move.battleId);

  if (!battle) {
    throw new Error(`Battle ${move.battleId} not found`);
  }

  try {
    verifyTurn(battle, move);
    verifyCell(battle, move);
  } catch (err) {
    logger.error(err);
    return battle;
  }

  battle.cells[move.cellIdx] = getSymbolForUser(battle, move);

  if (isWin(battle) || isDraw(battle)) {
    battle.status = battleGrpc.BattleStatus.FINISHED;
    if (isWin(battle)) {
      battle.winner = move.profileId;
    }
  }

  if (battle.status == battleGrpc.BattleStatus.FINISHED) {
    await battleStore().remove(battle.id);
  } else {
    await battleStore().set(battle);
  }

  await enqueueEvent(kafkaProducersConfig.topicBattleUpdated, battle);

  return battle;
};

export const leaveBattle = async (profileId: string, battleId: string) => {
  const battle = await battleStore().get(battleId);

  if (!battle) {

    logger.error(`Leave battle: Battle ${battleId} not found`);
    return;
  }

  if (!battle?.players.includes(profileId)) {
    throw new Error(`Battle ${battleId} doesnt have player ${profileId}`);
  }
  const winner = battle.players.find((id) => id !== profileId);
  battle.winner = winner ?? "";

  battle.status = battleGrpc.BattleStatus.FINISHED;

  await battleStore().remove(battle.id);

  await enqueueEvent(kafkaProducersConfig.topicBattleUpdated, battle);

  return battle;

};

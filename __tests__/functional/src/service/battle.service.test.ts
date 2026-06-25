// import crypto from "crypto";
// import { battleStore, battleNew, makeMove } from "../../../../src/services/battle.service";
// import { BattleCellValue, BattleObject, BattleStatus } from "../../../../src/grpc/generated/battle";
// import { BattleMoveRequest } from "../../../../src/grpc/generated/engine";
//
//
// describe("upsertBattle", () => {
//   let userId1: string;
//   let userId2: string;
//   let battle: BattleObject;
//
//   beforeEach(async () => {
//     userId1 = crypto.randomUUID();
//     userId2 = crypto.randomUUID();
//
//     battle = {
//       id: crypto.randomUUID(),
//       players: [userId1, userId2],
//       cells: [],
//       status: BattleStatus.ACTIVE,
//       winner: "",
//     };
//
//     await battleNew(battle);
//   });
//
//   test("новый баттл создаётся пустым", async () => {
//     const stored = await battleStore().get(battle.id);
//
//     expect(stored).not.toBeNull();
//     expect(stored?.cells).toEqual(Array(9).fill(BattleCellValue.CELL_EMPTY));
//     expect(stored?.status).toBe(BattleStatus.ACTIVE);
//   });
//
//   test("игрок делает корректный ход", async () => {
//     const move: BattleMoveRequest = {
//       battleId: battle.id,
//       userId: userId1,
//       cellIdx: 0,
//     };
//
//     await makeMove(move);
//
//     const updated = await battleStore().get(battle.id);
//     expect(updated?.cells[0]).toBe(BattleCellValue.CELL_X);
//   });
//
//   test("ошибка при неверном ходе (не твой ход)", async () => {
//     const move: BattleMoveRequest = {
//       battleId: battle.id,
//       userId: userId2, // должен ходить userId1 первым
//       cellIdx: 0,
//     };
//
//     await expect(makeMove(move)).rejects.toThrow("Not your turn");
//   });
//
//   test("ошибка при занятой клетке", async () => {
//     const move1: BattleMoveRequest = {battleId: battle.id, userId: userId1, cellIdx: 0};
//     await makeMove(move1);
//
//     const move2: BattleMoveRequest = {battleId: battle.id, userId: userId2, cellIdx: 0};
//     await expect(makeMove(move2)).rejects.toThrow("Cell is not empty");
//   });
//
//   test("победа игрока завершает баттл", async () => {
//     // X выигрывает по первой строке
//     await makeMove({battleId: battle.id, userId: userId1, cellIdx: 0});
//     await makeMove({battleId: battle.id, userId: userId2, cellIdx: 3});
//     await makeMove({battleId: battle.id, userId: userId1, cellIdx: 1});
//     await makeMove({battleId: battle.id, userId: userId2, cellIdx: 4});
//     await makeMove({battleId: battle.id, userId: userId1, cellIdx: 2});
//
//     const finished = await battleStore().get(battle.id);
//     expect(finished).toBeNull(); // баттл удалён из стора
//   });
//
//   test("ничья завершает баттл", async () => {
//     // последовательность ходов, приводящая к ничьей
//     const moves: BattleMoveRequest[] = [
//       {battleId: battle.id, userId: userId1, cellIdx: 0},
//       {battleId: battle.id, userId: userId2, cellIdx: 1},
//       {battleId: battle.id, userId: userId1, cellIdx: 2},
//       {battleId: battle.id, userId: userId2, cellIdx: 4},
//       {battleId: battle.id, userId: userId1, cellIdx: 3},
//       {battleId: battle.id, userId: userId2, cellIdx: 5},
//       {battleId: battle.id, userId: userId1, cellIdx: 7},
//       {battleId: battle.id, userId: userId2, cellIdx: 6},
//       {battleId: battle.id, userId: userId1, cellIdx: 8},
//     ];
//
//     for (const move of moves) {
//       await makeMove(move);
//     }
//
//     const finished = await battleStore().get(battle.id);
//     expect(finished).toBeNull(); // баттл удалён из стора
//   });
// });
import * as grpc from '@grpc/grpc-js';
import * as battleGrpc from '../generated/battle';
import * as engineGrpc from '../generated/engine';
import * as emptyGrpc from '../generated/common/empty';
import * as battleService from '../../services/battle.service';
import logger from "@shared/logger";


export async function battleChannel(
  call: grpc.ServerDuplexStream<engineGrpc.BattleStreamRequest, engineGrpc.BattleStreamResponse>
) {
  try {
    // слушаем входящие события от Streaming
    call.on("data", async (event: engineGrpc.BattleStreamRequest) => {
      try {
        if (event.start) {
          const battleObj: battleGrpc.BattleObject = event.start.battle as battleGrpc.BattleObject;

          const battle = await battleService.battleNew(battleObj);
          if (battle) call.write(engineGrpc.BattleStreamResponse.create({battle}));

        }

        if (event.move) {
logger.log('')

          const battleMoveRequest = event.move as engineGrpc.BattleMoveRequest;

          const battle = await battleService.makeMove(battleMoveRequest);

          logger.log(battle);
          if (battle) call.write(engineGrpc.BattleStreamResponse.create({battle}));
        }

        if (event.leave) {
          const battle = await battleService.leaveBattle(event.leave.profileId, event.leave.battleId);
          if (battle) call.write(engineGrpc.BattleStreamResponse.create({battle}));
        }

        if (event.ping) {
          // logger.info('Streaming-engine stream Ping');
          const ping = emptyGrpc.Empty.create({});
          call.write(engineGrpc.BattleStreamResponse.create({ping}));

          // heartbeat — можно просто игнорировать или логировать
        }
      } catch (err: any) {
        console.error("Event error:", err);
      }
    });

    call.on("end", () => {
      call.end();
    });

    call.on("error", (err) => {
      console.error("Stream error:", err);
      call.end();
    });

    logger.log('Grpc streaming connection established');
  } catch (err: any) {
    console.error("battleChannel error:", err);
    call.end();
  }
}

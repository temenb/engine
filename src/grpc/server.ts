import {EngineService} from './generated/engine';
import * as grpc from '@grpc/grpc-js';
import * as healthHandler from "./handlers/health.handler";
import * as engineHandler from "./handlers/engine.handler";

const server = new grpc.Server();

server.addService(EngineService, {
  health: healthHandler.health,
  status: healthHandler.status,
  livez: healthHandler.livez,
  readyz: healthHandler.readyz,

  battleChannel: engineHandler.battleChannel,
});

export default server;

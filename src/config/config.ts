export const config = {
  port: process.env.GRPC_PORT || 50051,
  serviceBattleUrl: process.env.SERVICE_BATTLE_URL || 'battle:50051',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET!,
};

export default config;

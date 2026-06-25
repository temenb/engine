// export async function battleStarted(topic: string, partition: number, message: any): Promise<void> {
//     try {
//       logger.log('battle Started', message.id)
//       await battleService.battleNew(message as BattleObject);
//     } catch (error) {
//       logger.error(`[Kafka] Failed to process message`, {
//         rawValue: message,
//         error,
//       });
//     }
// }


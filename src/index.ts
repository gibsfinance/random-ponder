import { Context, ponder } from "@/generated";
import * as viem from 'viem'
import { scopedId } from "./utils";
import * as randomUtils from '@gibs/random/lib/utils'
import { abi as randomAbi } from '@gibs/random/artifacts/contracts/Random.sol/Random.json'
import { Random$Type } from "@gibs/random/artifacts/contracts/Random.sol/Random";

ponder.on("random.ink()", async ({ event, context }) => {
  const [sectionInput, bytecode] = event.args
  const preimages = randomUtils.dataToPreimages(bytecode)
  const section = randomUtils.section(sectionInput)
  const [inkEventSignature] = viem.encodeEventTopics({
    abi: randomAbi as Random$Type["abi"],
    eventName: 'Ink',
  })
  const events = viem.parseEventLogs({
    abi: randomAbi as Random$Type["abi"],
    logs: event.transactionReceipt.logs,
  })
  const logs = events.filter((log) => (
    log.topics[0] === inkEventSignature
  ))
  const transactionId = scopedId(context, event.transactionReceipt.transactionHash)
  const { items } = await context.db.Ink.findMany({
    where: {
      transaction: transactionId,
    },
  })
  // const inkEvent = viem.parseEventLogs(logs[items.length]!)
  await context.db.Ink.create({
    id: scopedId(context, context.contracts.random.address,
      viem.concatBytes([
        viem.toBytes('ink'),
        viem.hexToBytes(section),
      ])
    ),
    data: {
      section,
      index: event.transaction.transactionIndex,
      pointer: pointer,
    },
  })
  // await context.db.ink.upsert({
  //   id: event.trace.from,
  //   create: {
  //     gasUsed: event.trace.gasUsed,
  //     bytes: event.args[0].reduce<number>(
  //       (acc, cur) => acc + Math.ceil((cur.callData.length - 2) / 8),
  //       0,
  //     ),
  //     successfulCalls: event.result.filter(({ success }) => success === true)
  //       .length,
  //     failedCalls: event.result.filter(({ success }) => success === false)
  //       .length,
  //   },
  //   update: ({ current }) => ({
  //     gasUsed: current.gasUsed + event.trace.gasUsed,
  //     bytes:
  //       current.bytes +
  //       event.args[0].reduce<number>(
  //         (acc, cur) => acc + Math.ceil((cur.callData.length - 2) / 8),
  //         0,
  //       ),
  //     successfulCalls:
  //       current.successfulCalls +
  //       event.result.filter(({ success }) => success === true).length,
  //     failedCalls:
  //       current.failedCalls +
  //       event.result.filter(({ success }) => success === false).length,
  //   }),
  // });
});

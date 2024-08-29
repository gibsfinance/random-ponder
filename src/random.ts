import { ponder } from "@/generated";
import * as viem from 'viem'
import { scopedId, upsertBlock, upsertTransaction } from "./utils";
import * as randomUtils from '@gibs/random/lib/utils'
import { abi as randomAbi } from '@gibs/random/artifacts/contracts/Random.sol/Random.json'
import { Random$Type } from "@gibs/random/artifacts/contracts/Random.sol/Random";

ponder.on("Random.ink()", async ({ event, context }) => {
  const [sectionInput, bytecode] = event.args
  const preimages = randomUtils.dataToPreimages(bytecode)
  if (!event.transactionReceipt) {
    event.transactionReceipt = await context.client.request({
      method: 'eth_getTransactionReceipt',
      params: [
        event.transaction.hash,
      ],
    })
  }
  const events = viem.parseEventLogs({
    abi: randomAbi as Random$Type["abi"],
    logs: event.transactionReceipt.logs,
    eventName: 'Ink',
  })
  await upsertBlock(context, event)
  const tx = await upsertTransaction(context, event)
  await Promise.all(events.map(async (inkEvent) => {
    const offset = BigInt.asUintN(128, inkEvent.args.offset >> 128n)
    const info = {
      ...sectionInput,
      provider: inkEvent.args.provider,
      offset,
    }
    const section = randomUtils.section(info)
    if (section !== inkEvent.args.section) {
      return
    }
    const template = randomUtils.template(info)
    // pointer id uses section because it is a readily available
    // abstraction. pointer storage is a reference to an
    // on chain contract holding preimages in bytecode data
    const pointerId = scopedId.pointer(context, section)
    const preimageEntities = preimages.map((preimage, index) => ({
      index,
      pointerId,
      data: preimage,
      template,
      section,
      accessed: false,
      id: scopedId.preimage(context, randomUtils.location(section, index)),
    }))
    const inkId = scopedId.ink(context, section)
    await context.db.Pointer.create({
      id: pointerId,
      data: {
        remaining: preimages.length,
        section,
        count: preimages.length,
        storage: inkEvent.args.pointer,
        lastOkTransactionId: tx.id,
        provider: inkEvent.args.provider,
        token: sectionInput.token,
        price: sectionInput.price,
        duration: sectionInput.duration,
        durationIsTimestamp: sectionInput.durationIsTimestamp,
        offset,
        chainId: BigInt(context.network.chainId),
        address: context.contracts.Random.address,
      },
    })
    await context.db.Preimage.createMany({ data: preimageEntities })
    await context.db.Ink.create({
      id: inkId,
      data: {
        section,
        index: event.transaction.transactionIndex,
        pointerId: pointerId,
        sender: inkEvent.args.sender,
        transactionId: tx.id,
      },
    })
  }))
})

ponder.on('Random:Heat', async ({ event, context }) => {
  const {
    // unused outside of indexers scoping their
    // get logs queries to the provider
    // provider,
    section,
    index,
  } = event.args
  const heatId = scopedId.heat(context, randomUtils.location(section, index))
  const preimageId = scopedId.preimage(context, randomUtils.location(section, index))
  const pointerId = scopedId.pointer(context, section)
  const tx = await upsertTransaction(context, event)
  await context.db.Pointer.update({
    id: pointerId,
    data: ({ current, }) => ({
      ...current,
      remaining: current.remaining - 1,
    }),
  })
  await context.db.Heat.create({
    id: heatId,
    data: {
      transactionId: tx.id,
      index: event.log.logIndex,
      // startId: undefined,
      preimageId,
    },
  })
})

ponder.on('Random:Start', async ({ event, context }) => {
  const { owner, key } = event.args
  const tx = await upsertTransaction(context, event)
  const startId = scopedId.start(context, key)
  await context.db.Heat.updateMany({
    where: {
      transactionId: tx.id,
      index: { lt: event.log.logIndex },
      startId: { equals: undefined },
    },
    data: {
      startId: startId,
    },
  })
  await context.db.Start.create({
    id: startId,
    data: {
      chopped: false,
      transactionId: tx.id,
      owner,
      key,
      index: event.log.logIndex,
    },
  })
})

ponder.on('Random:Reveal', async ({ event, context }) => {
  const {
    // provider,
    location,
    formerSecret,
  } = event.args
  const revealId = scopedId.reveal(context, location)
  const preimageId = scopedId.preimage(context, location)
  const tx = await upsertTransaction(context, event)
  const preimage = await context.db.Preimage.update({
    id: preimageId,
    data: {
      secret: formerSecret,
    },
  })
  await context.db.Pointer.update({
    id: preimage.pointerId,
    data: {
      lastOkTransactionId: tx.id,
    },
  })
  await context.db.Reveal.create({
    id: revealId,
    data: {
      index: event.log.logIndex,
      preimageId,
      transactionId: tx.id,
    },
  })
})

ponder.on('Random:Cast', async ({ event, context }) => {
  const { key, seed } = event.args
  const castId = scopedId.cast(context, key)
  const startId = scopedId.start(context, key)
  const tx = await upsertTransaction(context, event)
  await context.db.Cast.create({
    id: castId,
    data: {
      index: event.log.logIndex,
      transactionId: tx.id,
      key,
      startId,
      seed,
    },
  })
})

ponder.on('Random:Expired', async ({ event, context }) => {
  const { key } = event.args
  const startId = scopedId.start(context, key)
  const castId = scopedId.cast(context, key)
  const expiredId = scopedId.expired(context, key)
  const tx = await upsertTransaction(context, event)
  await context.db.Expired.create({
    id: expiredId,
    data: {
      index: event.log.logIndex,
      transactionId: tx.id,
      startId,
      castId,
    },
  })
  await context.db.Cast.update({
    id: castId,
    data: { expiredId },
  })
})

ponder.on('Random:Bleach', async ({ event, context }) => {
  const { provider, section } = event.args
  if (event.transactionReceipt.status !== 'success') {
    return
  }
  const bleachId = scopedId.bleach(context, section)
  const pointerId = scopedId.pointer(context, section)
  const tx = await upsertTransaction(context, event)
  console.log(bleachId)
  await context.db.Bleach.create({
    id: bleachId,
    data: {
      transactionId: tx.id,
      index: event.log.logIndex,
      pointerId,
    },
  })
  // const pointer =
  await context.db.Pointer.update({
    id: pointerId,
    data: {
      bleachId,
    },
  })
})

ponder.on('Reader:Ok', async ({ event, context }) => {
  const { section } = event.args
  const pointerId = scopedId.pointer(context, section)
  const tx = await upsertTransaction(context, event)
  await context.db.Pointer.update({
    id: pointerId,
    data: {
      lastOkTransactionId: tx.id,
    },
  })
})

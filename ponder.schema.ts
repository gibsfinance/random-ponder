import { createSchema } from "@ponder/core";

export default createSchema((p) => ({
  Block: p.createTable({
    id: p.hex(),
    hash: p.hex(),
    timestamp: p.bigint(),
    number: p.bigint(),
  }),
  Transaction: p.createTable({
    id: p.hex(),
    hash: p.hex(),
    index: p.int(),
    blockId: p.hex().references('Block.id'),
    block: p.one('blockId'),
  }),
  Pointer: p.createTable({
    id: p.hex(),
    section: p.hex(),
    template: p.hex(),
    remaining: p.int(),
    count: p.int(),
    storage: p.hex(),
    lastOkTransactionId: p.hex().references('Transaction.id'),
    lastOkTransaction: p.one('lastOkTransactionId'),
    provider: p.hex(),
    token: p.hex(),
    price: p.bigint(),
    duration: p.bigint(),
    durationIsTimestamp: p.boolean(),
    offset: p.bigint(),
    preimages: p.many('Preimage.pointerId'),
    bleachId: p.hex().optional().references('Bleach.id'),
    bleach: p.one('bleachId'),
    chainId: p.bigint(),
    address: p.hex(),
  }),
  Bleach: p.createTable({
    id: p.hex(),
    index: p.int(),
    transactionId: p.hex().references('Transaction.id'),
    transaction: p.one('transactionId'),
    pointerId: p.hex().references('Pointer.id'),
    pointer: p.one('pointerId'),
  }),
  Ink: p.createTable({
    id: p.hex(), // section
    index: p.int(),
    transactionId: p.hex().references('Transaction.id'),
    transaction: p.one('transactionId'),
    section: p.hex(),
    sender: p.hex(),
    pointerId: p.hex().references('Pointer.id'),
    pointer: p.one('pointerId'),
  }),
  Start: p.createTable({
    id: p.hex(),
    owner: p.hex(),
    key: p.hex(),
    index: p.int(),
    chopped: p.boolean(),
    transactionId: p.hex().references('Transaction.id'),
    transaction: p.one('transactionId'),
    heat: p.many('Heat.startId'),
    castId: p.hex().optional().references('Cast.id'),
    cast: p.one('castId'),
    expiredId: p.hex().optional().references('Expired.id'),
    expired: p.one('expiredId'),
  }),
  Heat: p.createTable({
    id: p.hex(),
    transactionId: p.hex().references('Transaction.id'),
    transaction: p.one('transactionId'),
    index: p.int(),
    preimageId: p.hex().references('Preimage.id'),
    preimage: p.one('preimageId'),
    startId: p.hex().optional().references('Start.id'),
    start: p.one('startId'),
  }),
  Preimage: p.createTable({
    id: p.hex(),
    index: p.int(),
    pointerId: p.hex().references('Pointer.id'),
    pointer: p.one('pointerId'),
    template: p.hex(),
    section: p.hex(),
    accessed: p.boolean(),
    data: p.hex(),
    secret: p.hex().optional(),
    timestamp: p.bigint().optional(),
    heatId: p.hex().optional().references('Heat.id'),
    heat: p.one('heatId'),
    startId: p.hex().optional().references('Start.id'),
    start: p.one('startId'),
    castId: p.hex().optional().references('Cast.id'),
    cast: p.one('castId'),
    revealId: p.hex().optional().references('Reveal.id'),
    reveal: p.one('revealId'),
  }),
  Reveal: p.createTable({
    id: p.hex(),
    index: p.int(),
    preimageId: p.hex().references('Preimage.id'),
    preimage: p.one('preimageId'),
    transactionId: p.hex().references('Transaction.id'),
    transaction: p.one('transactionId'),
    castId: p.hex().optional().references('Cast.id'),
    cast: p.one('castId'),
  }),
  Cast: p.createTable({
    id: p.hex(),
    index: p.int(),
    key: p.hex(),
    transactionId: p.hex().references('Transaction.id'),
    transaction: p.one('transactionId'),
    startId: p.hex().references('Start.id'),
    start: p.one('startId'),
    reveal: p.many('Reveal.castId'),
    expiredId: p.hex().optional().references('Expired.id'),
    expired: p.one('expiredId'),
    seed: p.hex().optional(),
  }),
  Expired: p.createTable({
    id: p.hex(),
    startId: p.hex().references('Start.id'),
    start: p.one('startId'),
    castId: p.hex().references('Cast.id'),
    cast: p.one('castId'),
    index: p.int(),
    transactionId: p.hex().references('Transaction.id'),
    transaction: p.one('transactionId'),
  }),
  Unveil: p.createTable({
    id: p.hex(),
    index: p.int(),
    transactionId: p.hex().references('Transaction.id'),
    transaction: p.one('transactionId'),
    consumerPreimageId: p.hex().references('ConsumerPreimage.id'),
    consumerPreimage: p.one('consumerPreimageId'),
  }),
  Chain: p.createTable({
    id: p.hex(),
    owner: p.hex(),
    identifier: p.bigint(),
    consumerPreimageId: p.hex().references('ConsumerPreimage.id'),
    consumerPreimage: p.one('consumerPreimageId'),
    undermineId: p.hex().references('Undermine.id'),
    undermine: p.one('undermineId'),
    startId: p.hex().references('Start.id'),
    start: p.one('startId'),
    transactionId: p.hex().references('Transaction.id'),
    transaction: p.one('transactionId'),
  }),
  Undermine: p.createTable({
    id: p.hex(),
    index: p.int(),
    transactionId: p.hex().references('Transaction.id'),
    transaction: p.one('transactionId'),
    consumerPreimageId: p.hex().references('ConsumerPreimage.id'),
    consumerPreimage: p.one('consumerPreimageId'),
    owner: p.hex(),
    chainId: p.hex().references('Chain.id'),
    chain: p.one('chainId'),
  }),
  ConsumerPreimage: p.createTable({
    id: p.hex(),
    data: p.hex(),
    secret: p.hex().optional(),
    chainId: p.hex().optional().references('Chain.consumerPreimage') as any,
    chain: p.one('chainId'),
    unveilId: p.hex().optional().references('Unveil.consumerPreimage') as any,
    unveil: p.one('unveilId'),
    undermineId: p.hex().optional().references('Undermine.consumerPreimage') as any,
    undermine: p.one('undermineId'),
  }),
}))

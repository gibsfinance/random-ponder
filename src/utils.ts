import * as viem from 'viem'
import { Context } from '@/generated'

export const scopedId = (
  context: Context,
  address: viem.Hex,
  bytes: viem.ByteArray = viem.hexToBytes('0x'),
) => {
  return viem.bytesToHex(viem.concatBytes([
    viem.numberToBytes(context.network.chainId, { size: 32 }),
    viem.hexToBytes(address),
    bytes,
  ]))
}

import { createConfig } from "@ponder/core";
import { http } from "viem";
import * as deployedAddresses from '@gibs/random/ignition/deployments/chain-943/deployed_addresses.json'
import { abi as randomAbi } from '@gibs/random/artifacts/contracts/Random.sol/Random.json'
import * as viem from 'viem'
import { Random$Type } from "@gibs/random/artifacts/contracts/Random.sol/Random";

const addresses = deployedAddresses as {
  [k in keyof typeof deployedAddresses]: viem.Hex;
}

export default createConfig({
  networks: {
    pulsechainV4: {
      chainId: 943,
      transport: http(process.env.PONDER_RPC_URL_943),
    },
  },
  contracts: {
    random: {
      network: "pulsechainV4",
      abi: randomAbi as Random$Type["abi"],
      address: addresses["RandomModule#Random"],
      startBlock: 19_938_103,
      includeCallTraces: true,
      includeTransactionReceipts: true,
    },
  },
});

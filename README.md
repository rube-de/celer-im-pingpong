# PingPong via Celer IM
This example example lets you send a message via the Celer inter-chain messaging ([IM])

[IM]: https://im-docs.celer.network/

## Setup 

Install the necessary NPM dependencies using `pnpm` or module manager of choice.

```sh
pnpm install
```

Then, prepare your hex-encoded private key for paying the deployment gas fee
and store it as an environment variable:

```sh
export PRIVATE_KEY=0x...
```

You will need to obtain TEST tokens on both networks.

## Running the Example

The see the full example in action, run

```sh
pnpm hardhat full-pingpong
```

This will do the following:

- Deploy contracts on both testnets (BSC Testent, Sapphire Testnet)
- Send a message (`"Hello from BSC"`) from the BSC Testnet to the Sapphire Testnet
- Listen to the messege sent via OPL on the Sapphire Testnet

If you want to run the steps one at a time, read the following chapters.

### Deploying Contracts

Deploy the contracts on the host network (BSC Testnet) and the enclav network
(Sapphire Testnet):

```sh
pnpm hardhat deploy-pingpong
```

### Sending the Ping Message

Sending the ping message from the host network (BSC Testnet):

```sh
pnpm hardhat send-ping --ping-addr <Ping contract address from above>
```

### Verifying the Message

Verifying that the ping message arrived on the enclave network (Sapphire-Testnet):

```sh
pnpm hardhat verify-ping --pong-addr <Pong contract address from above>
```

## Tasks

Running the example is done via hardhat tasks. You can find them in  `./tasks/index.ts`
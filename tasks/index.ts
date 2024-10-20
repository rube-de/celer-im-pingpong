import { task, subtask } from "hardhat/config";
import { assert } from "console";

task("full-pingpong")
  .addOptionalParam("message", "The message that should be bridged", "Hello from BSC")
  .addOptionalParam("hostNetwork", "Network to deploy the Host contract on", "bsc-testnet")
  .addOptionalParam("enclaveNetwork", "Network to deploy the Enclave contract on", "sapphire-testnet")
  .addOptionalParam("enclaveChainId", "Network to send ping to", "23295")
  .addOptionalParam("pingMessageBus", "Message bus contract address from host network", "0xAd204986D6cB67A5Bc76a3CB8974823F43Cb9AAA")
  .addOptionalParam("pongMessageBus", "Message bus contract address from enclave network", "0x9Bb46D5100d2Db4608112026951c9C965b233f4D")
  .setAction(async ({message, hostNetwork, enclaveNetwork, enclaveChainId, pingMessageBus, pongMessageBus}, hre) => {
    const { pingAddr, pongAddr } = await hre.run("deploy-pingpong", {
      pingNetwork: hostNetwork,
      pingMessageBus,
      pongNetwork: enclaveNetwork,
      pongMessageBus
    });
    console.log("===========================");
    await hre.run("send-ping", {
      pingAddr,
      pongAddr,
      message,
      hostNetwork,
      destChainId: enclaveChainId
    });
    console.log("===========================");
    await hre.run("verify-ping", {
      pongAddr,
      message,
      enclaveNetwork
    });
  })


task('deploy-pingpong')
  .addOptionalParam("pingNetwork", "Network to deploy the Ping contract on", "bsc-testnet")
  .addOptionalParam("pingMessageBus", "Message bus contract address", "0xAd204986D6cB67A5Bc76a3CB8974823F43Cb9AAA")
  .addOptionalParam("pongNetwork", "Network to deploy the Pong contract on", "sapphire-testnet")
  .addOptionalParam("pongMessageBus", "Message bus contract address", "0x9Bb46D5100d2Db4608112026951c9C965b233f4D")
  .setAction(async ({pingNetwork, pingMessageBus, pongNetwork, pongMessageBus}, hre) => {
    // Ensure contracts are compiled before proceeding
    await hre.run('compile');
    console.log("Start deployment of PingPong...");

    console.log("===========================");
    const pingAddr = await hre.run("deployPing", {
        pingNetwork,
        messageBus: pingMessageBus
    });
    console.log("===========================");
    const pongAddr = await hre.run("deployPong", {
        pongNetwork,
        messageBus: pongMessageBus
    });
    return { pingAddr, pongAddr };
  });

subtask("deployPing")
  .addParam("pingNetwork", "Network to deploy the Ping contract on", "bsc-testnet")
  .addParam("messageBus", "Message bus contract address", "0xAd204986D6cB67A5Bc76a3CB8974823F43Cb9AAA")
  .setAction(async ({pingNetwork, messageBus}, hre) => {
    await hre.switchNetwork(pingNetwork);
    console.log(`Deploying on ${hre.network.name}...`);
    const Ping = await hre.ethers.getContractFactory("Ping");    
    const ping = await Ping.deploy(messageBus);
    const pingAddr = await ping.waitForDeployment();
    console.log(`Ping deployed at: ${pingAddr.target}`);
    return pingAddr.target;
})

subtask("deployPong")
  .addParam("pongNetwork", "Network to deploy the Pong contract on", "sapphire-testnet")
  .addParam("messageBus", "Message bus contract address", "0x9Bb46D5100d2Db4608112026951c9C965b233f4D")
  .setAction(async ({pongNetwork, messageBus}, hre) => {
    await hre.switchNetwork(pongNetwork);
    console.log(`Deploying on ${hre.network.name}...`);
    const Pong = await hre.ethers.getContractFactory("Pong");
    const pong = await Pong.deploy(messageBus);
    const pongAddr = await pong.waitForDeployment();
    console.log(`Pong deployed at: ${pongAddr.target}`);
    return pongAddr.target;
})

task("send-ping")
  .addParam("pingAddr", "Address of the Ping contract")
  .addParam("pongAddr", "Address of the Pong contract")
  .addOptionalParam("message", "The message that should be bridged", "Hello from BSC")
  .addOptionalParam("hostNetwork", "Network to deploy the Host contract on", "bsc-testnet")
  .addOptionalParam("destChainId", "Network to send ping to", "23295")
  .setAction(async ({pingAddr, pongAddr, message, hostNetwork, destChainId}, hre) => {
    await hre.switchNetwork(hostNetwork);
    console.log(`Sending message on ${hre.network.name}...`);
    const signer = await hre.ethers.provider.getSigner();
    const ping = await hre.ethers.getContractAt("Ping", pingAddr, signer);

    // get messagebus
    const messageBusAddr = await ping.messageBus();
    const messageBus = await hre.ethers.getContractAt("IMessageBus", messageBusAddr, signer);
    //calc fee
    console.log("Calculating fee...");
    let fee = await messageBus.calcFee(hre.ethers.encodeBytes32String(message));
    fee = fee * 2n;
    console.log(`Fee: ${hre.ethers.formatEther(fee)} BNB`);

    // const fee = hre.ethers.parseEther('0.001');

    console.log("Sending message...");
    const result = await ping.getFunction('sendPing')
      .send(pongAddr, destChainId, hre.ethers.encodeBytes32String(message), { value: fee });    
    await result.wait();
    console.log("Message sent");
  })

  task('verify-ping')
  .addParam('pongAddr', 'Address of the Pong contract')
  .addOptionalParam("message", "The message that should be bridged", "Hello from BSC")
  .addOptionalParam("enclaveNetwork", "Network to deploy the Enclave contract on", "sapphire-testnet")
  .setAction(async ({pongAddr, message, enclaveNetwork}, hre) => {
    await hre.switchNetwork(enclaveNetwork);
    console.log(`Verifying message on ${hre.network.name}...`);
    let events;
    const spinner = ['-', '\\', '|', '/'];
    let current = 0;

    // Spinner animation
    const interval = setInterval(() => {
        process.stdout.write(`\rListing for event... ${spinner[current]}`);
        current = (current + 1) % spinner.length;
    }, 150);

    const signer = await hre.ethers.provider.getSigner();
    const pong = await hre.ethers.getContractAt("Pong", pongAddr, signer);

    do {
      const block = await hre.ethers.provider.getBlockNumber();

      events = await pong.queryFilter('MessageReceived', block - 10, 'latest');
      if (events.length === 0) {
        await new Promise(resolve => setTimeout(resolve, 60 * 1000));
      }
    } while (events.length === 0);
    
    // Clear the spinner line
    clearInterval(interval);
    process.stdout.write(`\r`); 
    process.stdout.clearLine(0);

    const parsedEvent = pong.interface.parseLog(events[0]);
    console.log(parsedEvent);
    const decoded = hre.ethers.decodeBytes32String(parsedEvent?.args?.message);
    console.log(`Message received with: ${decoded}`);
    assert(decoded == message);
  });
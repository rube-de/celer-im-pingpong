// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "sgn-v2-contracts/contracts/message/framework/MessageBusAddress.sol";
import "sgn-v2-contracts/contracts/message/framework/MessageReceiverApp.sol";
import "sgn-v2-contracts/contracts/message/interfaces/IMessageBus.sol";


contract Pong is MessageBusAddress, MessageReceiverApp {

    event MessageReceived(
        address srcContract,
        uint64 srcChainId,
        address sender,
        bytes message
    );

    constructor(address _messageBus) {
        messageBus = _messageBus;
    }

    function sendPong(
        address _dstContract,
        uint64 _dstChainId,
        bytes calldata _message
    ) external payable {
        bytes memory message = abi.encode(msg.sender, _message);
        IMessageBus(messageBus).sendMessage{value: msg.value}(_dstContract, _dstChainId, message);
    }

    function executeMessage(
        address _srcContract,
        uint64 _srcChainId,
        bytes calldata _message,
        address // executor
    ) external payable override onlyMessageBus returns (ExecutionStatus) {
        (address sender, bytes memory message) = abi.decode(
            (_message),
            (address, bytes)
        );
        emit MessageReceived(_srcContract, _srcChainId, sender, message);
        return ExecutionStatus.Success;
    }
}
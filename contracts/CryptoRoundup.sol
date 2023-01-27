// SPDX-License-Identifier: AGPL-3.0
pragma solidity 0.8.17;

// Reentrancy Guard
// Uniswap Router Interface

contract CryptoRoundup {

error Test();

    // User Settings
    struct UserSettings {
        uint coinAmount;
        uint coinThreshold;
        address tokenPurchase;
        uint tokenSlippage;
        address router;
    }
    UserSettings[] public userSettings;
    mapping(address => uint) public userID;

    constructor(

    ) {
        
    }

    function roundup() public {

        // estimate gas

        // swap coinAmount - gasCostPurchase - gasCostTransferOut

        // transfer purchased token to user

        // reset user settings

    }

    function addUser(
        uint _coinThreshold,
        address _tokenPurchase,
        uint _tokenSlippage,
        address _router
    ) external {
        UserSettings memory user = UserSettings({
            coinAmount: 0,
            coinThreshold: _coinThreshold,
            tokenPurchase: _tokenPurchase,
            tokenSlippage: _tokenSlippage,
            router: _router
        });
        userSettings.push(user);
        userID[msg.sender] = userSettings.length;
    }

    function editUser(
        uint _coinThreshold,
        address _tokenPurchase,
        uint _tokenSlippage,
        address _router
    ) external {
        uint id = userID[msg.sender];
        uint currentCoin = userSettings[id].coinAmount;
        UserSettings memory user = UserSettings({
            coinAmount: currentCoin,
            coinThreshold: _coinThreshold,
            tokenPurchase: _tokenPurchase,
            tokenSlippage: _tokenSlippage,
            router: _router
        });
        userSettings.push(user);
    }

}
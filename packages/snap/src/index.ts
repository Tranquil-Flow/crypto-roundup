import type { BIP44CoinTypeNode } from '@metamask/key-tree';
import { getBIP44AddressKeyDeriver } from '@metamask/key-tree';
import { OnRpcRequestHandler } from '@metamask/snap-types';
import { BigNumber, Contract, ethers, Wallet } from 'ethers';
import {
  Address,
  ERC20,
  RETURN_FAIL,
  RETURN_OK,
  UNISWAP,
} from './constants';
import { sortAddresses } from './utils';

/**
 * Get a message from the origin. For demonstration purposes only.
 *
 * @param originString - The origin string.
 * @returns A message based on the origin.
 */
export const getMessage = (originString: string): string =>
  `Hello, ${originString}!`;

/**
 * Handle incoming JSON-RPC requests, sent through `wallet_invokeSnap`.
 *
 * @param args - The request handler args as object.
 * @param args.origin - The origin of the request, e.g., the website that
 * invoked the snap.
 * @param args.request - A validated JSON-RPC request object.
 * @returns `null` if the request succeeded.
 * @throws If the request method is not valid for this snap.
 * @throws If the `snap_confirm` call failed.
 */
export const onRpcRequest: OnRpcRequestHandler = ({ origin, request }) => {
  switch (request.method) {
    case 'hello':
      return wallet.request({
        method: 'snap_confirm',
        params: [
          {
            prompt: getMessage(origin),
            description:
              'This custom confirmation is just for display purposes.',
            textAreaContent:
              'But you can edit the snap source code to make it do something, if you want to!',
          },
        ],
      });
    default:
      throw new Error('Method not found.');
  }
};

async function getSigner(provider: ethers.providers.Provider): Promise<Wallet> {
  // Metamask uses default HD derivation path
  // https://metamask.zendesk.com/hc/en-us/articles/360060331752-Importing-a-seed-phrase-from-another-wallet-software-derivation-path
  const ethereumNode = (await wallet.request({
    method: 'snap_getBip44Entropy_60',
  })) as unknown as BIP44CoinTypeNode;
  const deriveEthereumAccount = getBIP44AddressKeyDeriver(ethereumNode);
  // A bug:
  // The current public version of @metamask/key-tree's derive function returns the private key and chain code in a single buffer
  // Ether.js also accepts a 64 byte buffer without errors and returns wrong keys
  // Related issue: https://github.com/ethers-io/ethers.js/issues/2926
  // TODO(ritave): Update to newest key-tree when available and use deriveEthereumAccount(0).privateKey
  const mainAccountKey = deriveEthereumAccount(0).slice(0, 32);
  return new Wallet(mainAccountKey, provider);
}

function timestamp(): number {
  return Math.round(new Date().getTime() / 1000);
}

async function execute(tokenAAddress: Address, tokenBAddress: Address) {
  const provider = new ethers.providers.Web3Provider(wallet as any);
  // We use a private keys directly to skip Metamask send transaction user requests
  const signer = await getSigner(provider);

  if ((await provider.getNetwork()).name !== 'rinkeby') {
    return RETURN_FAIL;
  }

  const tokenA = new Contract(tokenAAddress, ERC20.abi, signer);
  const tokenB = new Contract(tokenBAddress, ERC20.abi, signer);

  // Asynchronous calls instead of linear
  const tokenData: [string, string, string, string] = await Promise.all([
    tokenA.name(),
    tokenA.symbol(),
    tokenB.name(),
    tokenB.symbol()
  ]);

  const tokenAData = {
    name: tokenData[0],
    symbol: tokenData[1],
  };

  const tokenBData = {
    name: tokenData[2],
    symbol: tokenData[3]
  };

  const shouldContinue = await wallet.request({
    method: 'snap_confirm',
    params: [
      {
        prompt: 'Do you want to use this account?',
        textAreaContent: `Do you want to use the account "${signer.address}" for algorithmic trading between "${tokenAData.name}" and "${tokenBData.name}"?`,
      },
    ],
  });
  if (!shouldContinue) {
    return RETURN_FAIL;
  }

  const uniswapFactory = new Contract(
    UNISWAP.contracts.factory.address,
    UNISWAP.contracts.factory.abi,
    signer,
  );

  const [uniswapPair]: Contract[] = await Promise.all([
    uniswapFactory
      .getPair(...sortAddresses(tokenAAddress, tokenBAddress))
      .then(
        (pair: Address) =>
          new Contract(pair, UNISWAP.contracts.pair.abi, signer),
      )
  ]);

  const uniswapRouterV2 = new Contract(
    UNISWAP.contracts.routerV2.address,
    UNISWAP.contracts.routerV2.abi,
    signer,
  );

          let promise: Promise<typeof RETURN_OK>;
          let resolve!: () => void;
          promise = new Promise((r) => {
            resolve = () => r(RETURN_OK);
          });
          stopPromise = { promise, resolve };

          while (true) {
            console.log('TRADER', 'Listening for events');
            // Wait for any change of state or request to finish
            const result = await Promise.race([
              stopPromise.promise,
              onceToPromise(uniswapPair, uniswapPair.filters.Sync()),
            ]);

            if (result === RETURN_OK) {
              console.log('TRADER', 'Requested to stop');
              stopPromise = undefined;
              return RETURN_OK;
            }
            console.log('TRADER', 'Sync happened, calculating trade');

            const [tokenAInitialBalance, tokenBInitialBalance]: BigNumber[] = await Promise.all(
              [tokenA.balanceOf(signer.address), tokenB.balanceOf(signer.address)],
            );

    //TODO: Change tradeAmount to user's thresholdAmount
    // divide by 2 for testing purposes
    const tradeAmount = tokenAInitialBalance.div(2);
    const [, amountBackUniswap]: BigNumber[] =
      await uniswapRouterV2.getAmountsOut(tradeAmount, [
        tokenAAddress,
        tokenBAddress,
      ]);
    console.log(
      'TRADER',
      `Expected amount gained ${amountBackUniswap.toString()}${
        tokenBData.symbol
      }`,
    );

    //TO-DO: Change for users setting
    const roundupEnabled = true;
    const aboveThreshold = true;

    // Execute Roundup Swap
    if (roundupEnabled == true &&
        aboveThreshold == true) {
      console.log('TRADER', 'User is above coin threshold, performing round up');
      // Swap
      await (
        await tokenA.approve(uniswapRouterV2.address, tradeAmount)
      ).wait();
      await (
        await uniswapRouterV2.swapExactTokensForTokens(
          tradeAmount,
          1,
          [tokenAAddress, tokenBAddress],
          signer.address,
          timestamp() + 300,
        )
      ).wait();

      // Success
      const endBalanceA: BigNumber = await tokenA.balanceOf(signer.address);
      const endBalanceB: BigNumber = await tokenB.balanceOf(signer.address);
      const tokenASpent = Number(tokenAInitialBalance) - Number(endBalanceA);

      // await stateMutex.runExclusive(async () => {
      //   const state: State = ((await wallet.request({
      //     method: 'snap_manageState',
      //     params: ['get'],
      //   })) as State | null) ?? { logs: [] };

      //   await wallet.request({
      //     method: 'snap_manageState',
      //     params: ['update', state],
      //   });
      // });

      console.log(
        'TRADER',
        `Executed roundup: 
          spent ${tokenASpent.toString()}${tokenAData.symbol},
          gained ${endBalanceB.toString()}${tokenBData.symbol} tokens`,
      );
    }
  }
}

// async function getExecuted() {
//   return (
//     ((await wallet.request({
//       method: 'snap_manageState',
//       params: ['get'],
//     })) as State | null) ?? { logs: [] }
//   ).logs;
// }

// async function stop() {
//   if (stopPromise === undefined) {
//     return RETURN_FAIL;
//   }
//   stopPromise.resolve();
//   return RETURN_OK;
// }

// wallet.registerRpcMessageHandler(async (_originString, requestObject) => {
//   switch (requestObject.method) {
//     case 'execute':
//       if (stopPromise !== undefined) {
//         return RETURN_FAIL;
//       }
//       return await execute(
//         requestObject.tokenA as Address,
//         requestObject.tokenB as Address,
//       );
//     case 'stop':
//       return await stop();
//     case 'get_executed':
//       return await getExecuted();
//     default:
//       throw new Error('Method not found.');
//   }
// });
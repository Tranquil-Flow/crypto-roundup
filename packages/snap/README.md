# Crypto Roundup Snap

A Metamask Snap that rounds up on the gas fees of every crypto transaction. These roundups are used to passively invest into the cryptocurrency of the user's choice. Through this users can dollar cost average into coins/tokens over time just from their everyday Metamask usage.

Metamask Snaps: https://docs.metamask.io/guide/snaps.html

Written in Typescript.

## Build Paths

[] Snap call Uniswap Router contract through Uniswap SDK
[] Snap stores coin on a smart contract for user, which then calls Uniswap Router at threshold
[] Snap displays relevant notifications
[] Snap stores data on user's roundups

## Settings

User can specify the settings for the Snap, determining:
- Networks Connected
- Token to Purchase for each Network
- Amount to Roundup on each tx
- Threshold of saved funds to Purchase token at

## Ideas

Consider:

- Gas efficient way to process roundups. Store native coin in a generated wallet rather than smart contract?

## Notes

- Babel is used for transpiling TypeScript to JavaScript, so when building with the CLI,
  `transpilationMode` must be set to `localOnly` (default) or `localAndDeps`.
- For the global `wallet` type to work, you have to add the following to your `tsconfig.json`:
  ```json
  {
    "files": ["./node_modules/@metamask/snap-types/global.d.ts"]
  }
  ```

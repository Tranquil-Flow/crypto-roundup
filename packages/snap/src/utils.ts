import { BigNumber } from 'ethers';
import { Address } from './constants';

export function sortAddresses(
  tokenAAddress: Address,
  tokenBAddress: Address,
): [Address, Address] {
  if (BigNumber.from(tokenAAddress).lt(tokenBAddress)) {
    return [tokenAAddress, tokenBAddress];
  }
  return [tokenBAddress, tokenAAddress];
}

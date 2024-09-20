import React, { useState } from 'react';
import * as ReactSwitch from '@radix-ui/react-switch';
import { useStore } from "../layout";

const Switch = ({ setNetwork }) => {
  const { networkId } = useStore();

  return (
    <form>
      <div className="flex items-center">
        <label className="text-black text-[15px] leading-none pr-[15px]" htmlFor="airplane-mode">
          {networkId === 'mainnet' ? 'Mainnet' : 'Testnet'}
        </label>
        <ReactSwitch.Root
          onCheckedChange={() => {
            // setClicked(!clicked)
            setNetwork(networkId === 'testnet' ? 'mainnet' : 'testnet')
          }}
          className="w-[42px] h-[25px] bg-blackA6 rounded-full relative shadow-[0_2px_10px] shadow-blackA4 focus:shadow-[0_0_0_2px] focus:shadow-black data-[state=checked]:bg-black outline-none cursor-pointer"
          id="airplane-mode"
          // @ts-ignore
          style={{ '-webkit-tap-highlight-color': 'rgba(0, 0, 0, 0)' }}
        >
          <ReactSwitch.Thumb className="block w-[21px] h-[21px] bg-white rounded-full shadow-[0_2px_2px] shadow-blackA4 transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[19px]" />
        </ReactSwitch.Root>
      </div>
    </form>
  )
}

export default Switch;

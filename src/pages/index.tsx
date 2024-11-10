import React from 'react';
import { useStore } from "../layout";
import { generateBtcAddress } from '../helpers/kdf'
import { bitcoin } from '../helpers/bitcoin'
import { useState, useEffect } from 'react'
import { useForm } from "react-hook-form"
import Spin from '../components/Spin'
import Image from 'next/image'
import Success from '../components/Success'
import { useRouter } from 'next/router'
import { StepperModal } from '../components/StepperModal'
import { convertBitcoin } from '../helpers/utils'
import { MPC_VARIABLE } from '../config'
import Switch from '../components/Switch'
import Selector from '../components/Select'

export default function Home() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()
  const { signedAccountId, wallet, networkId, addressType, setNetworkId, setAddressType } = useStore();
  const [balance, setBalance] = useState('0')
  const [address, setAddress] = useState('')
  const [progress, setProgress] = useState(false)
  const [error, setError] = useState('')
  const [path, setPath] = useState('bitcoin,1')
  const [hash, setHash] = useState('')
  const [txHash, setTxHash] = useState('')
  const [MPC_PUBLIC_KEY, setMpcPublicKey] = useState(MPC_VARIABLE['MPC_PUBLIC_KEY_TESTNET'])
  const router = useRouter()

  console.log('addressType', addressType)

  useEffect(() => {
    setMpcPublicKey(MPC_VARIABLE[networkId === 'testnet' ? 'MPC_PUBLIC_KEY_TESTNET' : 'MPC_PUBLIC_KEY_MAINNET'])
  }, [networkId])

  useEffect(() => {
    if (router.query && router.query.transactionHashes) {
      const urlHash = router.query.transactionHashes

      setHash(String(urlHash))
    }
  }, [router.query.transactionHashes])

  const broadcastTx = async () => {
    setProgress(true)

    const storageTo = localStorage.getItem('data_to');
    const storageAmount = localStorage.getItem('data_amount');
    const storagePath = localStorage.getItem('data_path');

    if (!storageTo || !storageAmount || !storagePath) return

    const sig = await wallet.getTransactionResult(hash)

    // @ts-ignore
    const struct = await generateBtcAddress({
      publicKey: MPC_PUBLIC_KEY,
      accountId: signedAccountId,
      path: storagePath,
      isTestnet: networkId === 'testnet',
      addressType
    })

    const btcAddress = struct.address
    const btcPublicKey = struct.publicKey

    const response: string | void | Response = await bitcoin.broadcast({
      from: btcAddress,
      publicKey: btcPublicKey,
      to: storageTo,
      amount: storageAmount,
      path: storagePath,
      sig
    })

    if (typeof response === 'string') {
      setTxHash(response)
      localStorage.removeItem('data_to');
      localStorage.removeItem('data_amount');
      localStorage.removeItem('data_path');
    } else {
      response.text().then((text) => {
        // Assuming the error message is in the response body as text
        setError(text);
      }).catch((error) => {
        // In case of an error while reading the response
        setError('An error occurred while processing the response');
      });
    }

    setProgress(false)
  }

  const getAddress = async () => {
    const struct = await generateBtcAddress({
      publicKey: MPC_PUBLIC_KEY,
      accountId: signedAccountId,
      path,
      isTestnet: networkId === 'testnet',
      addressType
    })
    setAddress(struct.address)
    return [struct.address, struct.publicKey]
  }

  const onSubmit = async (data) => {
    const amountInSats = convertBitcoin(data.amount, 'sats')

    const struct = await generateBtcAddress({
      publicKey: MPC_PUBLIC_KEY,
      accountId: signedAccountId,
      path,
      isTestnet: networkId === 'testnet',
      addressType
    })

    const btcAddress = struct.address
    const btcPublicKey = struct.publicKey
    const okx_account_id = localStorage.getItem('okx_account_id')

    let walletId
    if (okx_account_id) {
      walletId = 'okx-wallet'
    } else {
      walletId = localStorage.getItem('near-wallet-selector:selectedWalletId').replace(/['"]+/g, '')
    }

    if (walletId === "meteor-wallet" || walletId === 'okx-wallet') {
      setProgress(true)
      const txHash = await bitcoin.getAndBroadcastSignature({
        from: btcAddress,
        publicKey: btcPublicKey,
        to: data.to,
        amount: amountInSats,
        path: data.path,
      })
      setProgress(false)
      if (typeof txHash === 'string') {
        setTxHash(txHash)
      } else {
        if (txHash) {
          txHash.text().then((text) => {
            // Assuming the error message is in the response body as text
            setError(text);
          }).catch((error) => {
            // In case of an error while reading the response
            setError('An error occurred while processing the response');
          });
        } else {
          setError('Something went wrong')
        }
      }
    } else {
      localStorage.setItem('data_to', data.to);
      localStorage.setItem('data_amount', amountInSats);
      localStorage.setItem('data_path', data.path);
  
      await bitcoin.getSignature({
        from: btcAddress,
        publicKey: btcPublicKey,
        to: data.to,
        amount: amountInSats,
        path: data.path,
      })
    }
  }

  useEffect(() => {
    getAddress()
  }, [signedAccountId, path, balance, error, hash, MPC_PUBLIC_KEY, addressType])

  const checkBal = async () => {
    const response = await bitcoin.getBalance({
      address: address,
    })
    if (response) {
      setBalance(response)  
    } else {
      setBalance('0')
    }
  }

  const resetForm = () => window.location.replace('/');

  return (
    <main className={'w-[100vw] h-[100vh] flex justify-center items-center'}>
      {error
        ? <div className={"flex border justify-center items-center min-w-[30em] max-w-[30em] w-[50vw] min-h-[24em] max-h-[30em] h-[50vh] bg-white rounded-xl shadow-xl p-4"} style={{ display: 'flex', flexDirection: 'column' }}>
            <Image
              alt="Failure"
              src={'fail.svg'}
              width={200}
              height={200}
            />
            <p className="w-full text-center">{error}</p> 
            <button onClick={() => resetForm()} className={'mt-4 bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded-md border w-48 mb-2 cursor-pointer'}>OK</button>
          </div>
        : txHash
        ? <div className={"flex border justify-center items-center min-w-[30em] max-w-[30em] w-[50vw] min-h-[24em] max-h-[30em] h-[50vh] bg-white rounded-xl shadow-xl p-4 text-over"} style={{ display: 'flex', flexDirection: 'column' }}>
          <Success />
          <p className='my-2'>Explorer link:</p>
          <p className="w-full break-words cursor-pointer hover:opacity-50 my-2" onClick={() => window.open(`https://blockstream.info${networkId === 'testnet' ? '/testnet' : ''}/tx/${txHash}`, '_blank')}>{`https://blockstream.info${networkId === 'testnet' ? '/testnet' : ''}/tx/${txHash}`}</p> 
          <p className='my-2'>NOTE: it might take a minute for transaction to be included in mempool</p>
          <button onClick={() => resetForm()} className={'mt-4 bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded-md border w-48 mb-2 cursor-pointer'}>OK</button>
        </div>
        : progress 
        ? <div className={"flex border justify-center items-center min-w-[30em] max-w-[30em] w-[50vw] min-h-[26em] max-h-[24em] h-[50vh] bg-white rounded-xl shadow-xl p-4"} style={{ display: 'flex', flexDirection: 'column' }}>
            <p></p>
            <Spin />
          </div>
        : hash
        ? <StepperModal broadcastTx={broadcastTx} reset={resetForm} />
        : <div className={"flex justify-center min-w-[30em] max-w-[30em] w-[50vw] min-h-[31em] max-h-[24em] h-[50vh] bg-white rounded-xl shadow-xl p-4"} style={{ display: 'flex', flexDirection: 'column' }}>
          <div className='flex'>
            <div className={'flex flex-col w-[12.35em]'}>
              <p className='w-1/2'>{`Tx type:`}</p>
              {/* @ts-ignore */}
              <Selector onValueChange={setAddressType} />
            </div>
            <div className='w-1/2 flex justify-end items-start mt-[5px] ml-5'>
              <Switch setNetwork={setNetworkId} />
            </div>
          </div>
          <p>{`Path:`}</p>
          <div className='w-full flex'>
            <div className='w-1/2'>
              <input className="p-1 rounded bg-slate-700 text-white pl-4" defaultValue={'bitcoin,1'}  {...register("path")} onChange={(e) => setPath(e.target.value)} />
            </div>
            <div className='w-1/2 flex items-center justify-end'>
            </div>
          </div>
          <p>{`Address:`}</p>
          <input className="border p-1 rounded bg-slate-500 text-white pl-4" defaultValue={address} disabled />

          <p onClick={() => checkBal()}>{`Balance:`}</p>
          <div className="flex justify-center items-center">
            <input className="border p-1 rounded bg-slate-500 text-white pl-4 w-4/5 h-10 " defaultValue={balance == '0' ? '0' : convertBitcoin(balance, 'btc')} disabled />
            <button onClick={() => checkBal()} className={'bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded border w-1/5 cursor-pointer h-10'}>Check</button>
          </div>

          <div className="flex flex-col">
          <form className="flex flex-col mt-8" onSubmit={handleSubmit(onSubmit)}>
            <p>To Address:</p>
            <input className="border p-1 rounded bg-slate-700 text-white pl-4" placeholder="To Address" {...register("to")} />

            <p>{'Value (in btc, not sats):'}</p>
            <input className="border p-1 rounded bg-slate-700 text-white pl-4" placeholder="Value" {...register("amount", { required: true })} />

            {errors.exampleRequired && <span>This field is required</span>}

            <button className={'mt-4 bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded-md border w-48 mb-2 cursor-pointer'} type="submit">Send BTC</button>
            <p className="w-full break-words cursor-pointer hover:opacity-50"onClick={() => window.open('https://coinfaucet.eu/en/btc-testnet/', '_blank')} 
            >Testnet BTC Faucet</p>
          </form>
        </div>
      </div>}
    </main>
  );
}

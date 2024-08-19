import Image from 'next/image';

export const StepperModal = ({
  broadcastTx,
  reset
}) => {
  return (<div className={"flex border justify-center items-center min-w-[30em] max-w-[30em] w-[50vw] min-h-[24em] max-h-[30em] h-[50vh] bg-white rounded-xl shadow-xl p-4"} style={{ display: 'flex', flexDirection: 'column' }}>
    <p className="w-full text-center">{'Signature Retrieved'}</p>
    <p className="w-full text-center">{'Broadcast transaction?'}</p>
    <div className='flex'>
      <button onClick={() => reset()} className={'mt-4 bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded-md border w-48 mb-2 cursor-pointer'}>Go Back </button>
      <button onClick={() => broadcastTx()} className={'mt-4 bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded-md border w-48 mb-2 cursor-pointer'}>Broadcast </button>
    </div>
  </div>)
};

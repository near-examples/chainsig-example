import React from 'react';
import BackgroundPattern from './BackgroundPattern'

const BackgroundPatternX = () => {
  return (
    <div className='w-[100vw] h-[100vh] fixed -z-10'>
      <BackgroundPattern sizing={30} className={'w-[100vw] h-[100vh] bg-[#6CE89E]'} fill={"black"} />
      <BackgroundPattern sizing={30} className='bowtiePolygon bg-black w-[100vw] h-[100vh]' />
    </div>
  );
};

export default BackgroundPatternX;
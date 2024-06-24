import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import Logo from '/public/near-logo.svg';
import { useStore } from '../layout';

export const Navigation = () => {
  const { signedAccountId, wallet } = useStore();
  const [action, setAction] = useState<() => void>(() => () => {});
  const [label, setLabel] = useState('Loading...');

  useEffect(() => {
    if (!wallet) return;

    if (signedAccountId) {
      setAction(() => () => wallet.signOut());
      setLabel(`Logout ${signedAccountId}`);
    } else {
      setAction(() => () => wallet.signIn());
      setLabel('Login');
    }
  }, [signedAccountId, wallet]);

  return (
    <nav className="flex w-full fixed bg-white">
      <div className="flex justify-between p-2 w-full shadow-lg">
        <Link href="/" passHref legacyBehavior>
          <a>
            <Image priority src={Logo} alt="NEAR" width={30} height={24} className="d-inline-block align-text-top" />
          </a>
        </Link>
        <div className='navbar-nav w-full flex justify-end'>
          <button className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded" onClick={action}> {label} </button>
        </div>
      </div>
    </nav>
  );
};

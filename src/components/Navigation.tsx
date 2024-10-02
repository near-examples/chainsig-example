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
      setAction(() => () => {
        const okx_account_id = localStorage.getItem('okx_account_id')
        if (okx_account_id) {
          localStorage.removeItem('okx_account_id')
          window.location.replace('/');
        } else {
          wallet.signOut()
        }
      });
      setLabel(`Logout ${signedAccountId}`);
    } else {
      setAction(() => () => wallet.signIn());
      setLabel('Login');
    }
  }, [signedAccountId, wallet]);

  return (
    <nav className="flex w-full fixed bg-white">
      <div className="flex justify-between p-2 w-full shadow-lg">
        <div className='flex items-center' onClick={() => window.location.replace('/')}>
          <Link href="/" passHref legacyBehavior>
            <a>
              <Image priority src={Logo} alt="NEAR" width={30} height={30} className="d-inline-block align-text-top" />
            </a>
          </Link>
        </div>
        <div className='navbar-nav w-full flex justify-end'>
          <button className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded" onClick={action}> {label} </button>
        </div>
      </div>
    </nav>
  );
};

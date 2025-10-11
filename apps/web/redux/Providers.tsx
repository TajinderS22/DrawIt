'use client';

import { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';

interface Props {
  children: ReactNode;
}

export default function Providers({ children }: Props) {
  return <Provider store={store}>{children}</Provider>;
}

import type { ReactNode } from 'react'
import { TanstackQueryProvider } from './TanstackQueryProvider'

export function Providers({ children }: { children: ReactNode }) {
  return <TanstackQueryProvider>{children}</TanstackQueryProvider>
}

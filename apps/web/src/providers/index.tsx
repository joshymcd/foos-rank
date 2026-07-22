import TanstackQueryProvider from './TanstackQueryProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return <TanstackQueryProvider>{children}</TanstackQueryProvider>
}

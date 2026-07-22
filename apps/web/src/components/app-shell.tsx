import { Link } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { resetData } from '../collections/mock-api'
import { resetOrganization } from '../collections/organization'
import { queryClient } from '../query-client'

const navigation = [
  ['Overview', '/overview'],
  ['Leaderboard', '/leaderboard'],
  ['People', '/people'],
  ['Matches', '/matches'],
] as const

export function AppShell({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  const reset = useMutation({
    mutationFn: async () => {
      await resetData()
      await resetOrganization()
      await queryClient.invalidateQueries({ queryKey: ['foosrank'] })
    },
  })
  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <a className="sr-only focus:not-sr-only" href="#content">
        Skip to content
      </a>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link
            to="/overview"
            className="text-xl font-bold tracking-tight text-slate-900"
          >
            FoosRank
          </Link>
          <Link
            to="/matches/new"
            className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Start match
          </Link>
        </div>
        <nav
          aria-label="Main navigation"
          className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 sm:px-6"
        >
          {navigation.map(([label, to]) => (
            <Link
              key={to}
              to={to}
              activeProps={{ className: 'border-emerald-700 text-emerald-800' }}
              className="border-b-2 border-transparent px-3 py-3 text-sm font-medium text-slate-600 hover:text-slate-950"
            >
              {label}
            </Link>
          ))}
        </nav>
      </header>
      <main id="content" className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Reset all local FoosRank data?'))
                reset.mutate(undefined)
            }}
            className="text-sm text-slate-500 underline hover:text-slate-950"
          >
            Reset demo
          </button>
        </div>
        {children}
      </main>
    </div>
  )
}

export function EmptyOrganization() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 text-slate-600">
      Create or load an organization before using this page.
    </div>
  )
}

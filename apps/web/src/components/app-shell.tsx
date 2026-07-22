import { Link } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { resetMatches } from '../collections/matches'
import { resetOrganization } from '../collections/organization'
import { resetPeople } from '../collections/people'
import { queryClient } from '../collections'

export function AppShell({
  children,
  organizationId,
}: {
  children: ReactNode
  organizationId: string
}) {
  const reset = useMutation({
    mutationFn: async () => {
      await resetMatches()
      await resetOrganization()
      await resetPeople()
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
            to="/"
            className="text-xl font-bold tracking-tight text-slate-900"
          >
            FoosRank
          </Link>
          <Link
            to="/$organizationId/matches/new"
            params={{ organizationId }}
            className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Start match
          </Link>
        </div>
        <nav
          aria-label="Main navigation"
          className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 sm:px-6"
        >
          <Link
            to="/$organizationId"
            params={{ organizationId }}
            activeProps={{ className: 'border-emerald-700 text-emerald-800' }}
            className="border-b-2 border-transparent px-3 py-3 text-sm font-medium text-slate-600 hover:text-slate-950"
          >
            Overview
          </Link>
          <Link
            to="/$organizationId/leaderboard"
            params={{ organizationId }}
            activeProps={{ className: 'border-emerald-700 text-emerald-800' }}
            className="border-b-2 border-transparent px-3 py-3 text-sm font-medium text-slate-600 hover:text-slate-950"
          >
            Leaderboard
          </Link>
          <Link
            to="/$organizationId/people"
            params={{ organizationId }}
            activeProps={{ className: 'border-emerald-700 text-emerald-800' }}
            className="border-b-2 border-transparent px-3 py-3 text-sm font-medium text-slate-600 hover:text-slate-950"
          >
            People
          </Link>
          <Link
            to="/$organizationId/matches"
            params={{ organizationId }}
            activeProps={{ className: 'border-emerald-700 text-emerald-800' }}
            className="border-b-2 border-transparent px-3 py-3 text-sm font-medium text-slate-600 hover:text-slate-950"
          >
            Matches
          </Link>
        </nav>
      </header>
      <main id="content" className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex justify-end">
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

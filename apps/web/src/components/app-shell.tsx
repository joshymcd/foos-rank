import { Link } from '@tanstack/react-router'
import { LayoutDashboard, Plus, Swords, Trophy, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../lib/cn'
import { EmptyState } from './ui/empty-state'
import { ThemeToggle } from './ui/theme-toggle'

const navItems = [
  {
    to: '/$organizationId',
    label: 'Overview',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    to: '/$organizationId/leaderboard',
    label: 'Leaderboard',
    icon: Trophy,
    exact: false,
  },
  {
    to: '/$organizationId/people',
    label: 'Players',
    icon: Users,
    exact: false,
  },
  {
    to: '/$organizationId/matches',
    label: 'Matches',
    icon: Swords,
    exact: false,
  },
] as const

function Brand({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn('flex items-center gap-2.5', className)}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-on-brand">
        <Trophy className="size-4" aria-hidden />
      </span>
      <span className="font-display text-lg font-bold tracking-tight text-text">
        FoosRank
      </span>
    </Link>
  )
}

export function AppShell({
  children,
  organizationId,
  organizationName,
}: {
  children: ReactNode
  organizationId: string
  organizationName: string
}) {
  const sidebarLink =
    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-text'
  const sidebarLinkActive =
    'bg-brand-soft text-brand hover:bg-brand-soft hover:text-brand'

  return (
    <div className="min-h-screen bg-bg text-text">
      <a className="sr-only focus:not-sr-only" href="#content">
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-border bg-card md:flex">
        <div className="px-5 py-5">
          <Brand />
          <p className="mt-3 truncate text-xs font-medium text-muted">
            {organizationName}
          </p>
        </div>
        <nav aria-label="Main navigation" className="flex-1 space-y-1 px-3">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              params={{ organizationId }}
              activeOptions={{ exact: item.exact }}
              activeProps={{ className: sidebarLinkActive }}
              className={sidebarLink}
            >
              <item.icon className="size-4" aria-hidden />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-1 border-t border-border p-3">
          <Link
            to="/$organizationId/matches/new"
            params={{ organizationId }}
            className="mb-2 flex h-11 items-center justify-center gap-2 rounded-lg bg-brand text-sm font-semibold text-on-brand hover:bg-brand/90"
          >
            <Plus className="size-4" aria-hidden />
            Start match
          </Link>
          <ThemeToggle />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/80 px-4 py-3 backdrop-blur md:hidden">
        <div className="min-w-0">
          <Brand />
          <p className="mt-1 truncate text-xs text-muted">{organizationName}</p>
        </div>
        <ThemeToggle />
      </header>

      <div className="md:pl-60">
        <main
          id="content"
          className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6 sm:px-6 md:px-10 md:pb-12 md:pt-10"
        >
          {children}
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav
        aria-label="Main navigation"
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-border bg-card/90 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        {navItems.slice(0, 2).map((item) => (
          <MobileTab
            key={item.to}
            item={item}
            organizationId={organizationId}
          />
        ))}
        <div className="flex items-start justify-center">
          <Link
            to="/$organizationId/matches/new"
            params={{ organizationId }}
            aria-label="Start match"
            className="-mt-4 flex size-12 items-center justify-center rounded-full bg-brand text-on-brand shadow-lg shadow-brand/30"
          >
            <Plus className="size-6" aria-hidden />
          </Link>
        </div>
        {navItems.slice(2).map((item) => (
          <MobileTab
            key={item.to}
            item={item}
            organizationId={organizationId}
          />
        ))}
      </nav>
    </div>
  )
}

function MobileTab({
  item,
  organizationId,
}: {
  item: (typeof navItems)[number]
  organizationId: string
}) {
  return (
    <Link
      to={item.to}
      params={{ organizationId }}
      activeOptions={{ exact: item.exact }}
      activeProps={{ className: 'text-brand' }}
      className="flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold text-faint transition-colors"
    >
      <item.icon className="size-5" aria-hidden />
      {item.label}
    </Link>
  )
}

export function EmptyOrganization() {
  return (
    <EmptyState
      icon={<Users className="size-8" aria-hidden />}
      title="No organization loaded"
      description="Create or load an organization before using this page."
      action={
        <Link
          to="/"
          className="inline-flex h-11 items-center justify-center rounded-lg bg-brand px-4 text-sm font-semibold text-on-brand hover:bg-brand/90"
        >
          Go home
        </Link>
      }
    />
  )
}

import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Card } from '../../components/ui/card'
import { organizationSnapshotOptions } from '../../data/queries'
import { leaderboard } from '../../domain/elo'

export const Route = createFileRoute('/$organizationId/leaderboard')({
  component: Leaderboard,
})

function Leaderboard() {
  const { organizationId } = Route.useParams()
  const snapshot = useQuery(organizationSnapshotOptions(organizationId)).data
  const people = snapshot?.people ?? []
  const matches = (snapshot?.matches ?? []).filter((match) => match.complete)
  const ranks = leaderboard(people, matches)

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Leaderboard
        </h1>
        <p className="mt-1 text-sm text-muted">Ranked by Elo rating.</p>
      </header>

      <Card className="overflow-hidden">
        <div className="divide-y divide-border">
          {ranks.map((person) => (
            <Link
              key={person.id}
              to="/$organizationId/people/$personId"
              params={{ organizationId, personId: person.id }}
              className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-surface sm:px-5"
            >
              <span className="text-center font-display text-sm font-bold text-muted tabular-nums">
                {person.rank}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{person.name}</p>
                <p className="text-xs text-muted tabular-nums">
                  {person.played} played · {person.wins}W – {person.losses}L
                </p>
              </div>
              <strong className="font-display text-sm tabular-nums">
                {Math.round(person.elo)}
              </strong>
            </Link>
          ))}
          {ranks.length === 0 && (
            <p className="px-5 py-6 text-sm text-muted">No players yet.</p>
          )}
        </div>
      </Card>
    </div>
  )
}

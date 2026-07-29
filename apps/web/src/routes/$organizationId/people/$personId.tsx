import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Scoreboard } from '../../../components/scoreboard'
import { Avatar } from '../../../components/ui/avatar'
import { buttonVariants } from '../../../components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card'
import { EmptyState } from '../../../components/ui/empty-state'
import { organizationSnapshotOptions } from '../../../data/queries'
import { headToHead, leaderboard } from '../../../domain/elo'

export const Route = createFileRoute('/$organizationId/people/$personId')({
  component: PlayerProfile,
})

function PlayerProfile() {
  const { organizationId, personId } = Route.useParams()
  const snapshot = useQuery(organizationSnapshotOptions(organizationId)).data
  const people = snapshot?.people ?? []
  const matches = (snapshot?.matches ?? []).filter((match) => match.complete)
  const person = leaderboard(people, matches).find(
    (item) => item.id === personId,
  )

  if (!person) {
    return (
      <EmptyState
        title="Player not found"
        description="This player is not on the roster."
        action={
          <Link
            to="/$organizationId/people"
            params={{ organizationId }}
            className={buttonVariants()}
          >
            Back to players
          </Link>
        }
      />
    )
  }

  const personMatches = matches
    .filter((match) =>
      match.participants.some(
        (participant) => participant.personId === personId,
      ),
    )
    .sort((a, b) => (b.sequence ?? 0) - (a.sequence ?? 0))
  const rivals = headToHead(personId, people, matches)

  return (
    <div className="space-y-5">
      <Link
        to="/$organizationId/people"
        params={{ organizationId }}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-text"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Players
      </Link>

      <Card className="flex items-center gap-4 p-5">
        <Avatar name={person.name} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-2xl font-bold tracking-tight">
            {person.name}
          </h1>
          <p className="mt-1 text-sm text-muted tabular-nums">
            Rank {person.rank} · {person.wins}W – {person.losses}L
          </p>
        </div>
        <div className="text-right">
          <strong className="font-display text-2xl tabular-nums text-brand">
            {Math.round(person.elo)}
          </strong>
          <p className="text-xs text-muted">Elo</p>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Recent matches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {personMatches.slice(0, 5).map((match) => (
                <Link
                  key={match.id}
                  to="/$organizationId/matches/$matchId"
                  params={{ organizationId, matchId: match.id }}
                  className="block py-3"
                >
                  <time className="mb-2 block text-xs text-muted">
                    {new Date(
                      match.completedAt ?? match.startedAt,
                    ).toLocaleString()}
                  </time>
                  <Scoreboard match={match} people={people} />
                </Link>
              ))}
              {personMatches.length === 0 && (
                <p className="py-3 text-sm text-muted">No matches yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Head to head</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {rivals.map((rival) => (
                <Link
                  key={rival.personId}
                  to="/$organizationId/people/$personId"
                  params={{ organizationId, personId: rival.personId }}
                  className="flex items-center justify-between gap-3 py-2.5 text-sm"
                >
                  <span className="truncate font-medium">{rival.name}</span>
                  <span className="text-muted tabular-nums">
                    {rival.wins}W – {rival.losses}L
                  </span>
                </Link>
              ))}
              {rivals.length === 0 && (
                <p className="py-3 text-sm text-muted">No opponents yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

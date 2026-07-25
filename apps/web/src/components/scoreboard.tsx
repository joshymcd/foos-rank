import type { Match, TeamColor } from '../collections/matches'
import type { Person } from '../collections/people'
import { cn } from '../lib/cn'
import { Avatar } from './ui/avatar'

function teamParticipants(
  match: Pick<Match, 'participants'>,
  people: Person[],
  team: TeamColor,
) {
  return match.participants
    .filter((participant) => participant.team === team)
    .map((participant) => ({
      ...participant,
      name:
        people.find((person) => person.id === participant.personId)?.name ??
        'Unknown',
    }))
}

function TeamPanel({
  match,
  people,
  team,
  dimmed,
}: {
  match: Match
  people: Person[]
  team: TeamColor
  dimmed: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-lg p-3 transition-opacity',
        team === 'red'
          ? 'bg-team-red-soft text-team-red'
          : 'bg-team-blue-soft text-team-blue',
        dimmed && 'opacity-55',
      )}
    >
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider opacity-80">
        {team}
      </p>
      <div className="flex flex-col gap-1.5">
        {teamParticipants(match, people, team).map((participant) => (
          <div
            key={participant.personId + participant.role}
            className="flex min-w-0 items-center gap-2"
          >
            <Avatar name={participant.name} size="xs" />
            <span className="truncate text-sm font-semibold text-text">
              {participant.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Scoreboard({
  match,
  people,
}: {
  match: Match
  people: Person[]
}) {
  const winner =
    match.complete && match.score
      ? match.score.red > match.score.blue
        ? 'red'
        : 'blue'
      : null
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-3">
      <TeamPanel
        match={match}
        people={people}
        team="red"
        dimmed={winner === 'blue'}
      />
      <div className="px-1 text-center">
        {match.score ? (
          <span className="font-display text-2xl font-bold tabular-nums text-text">
            {match.score.red}
            <span className="mx-1 text-faint">–</span>
            {match.score.blue}
          </span>
        ) : (
          <span className="font-display text-xs font-bold uppercase tracking-widest text-faint">
            vs
          </span>
        )}
      </div>
      <TeamPanel
        match={match}
        people={people}
        team="blue"
        dimmed={winner === 'red'}
      />
    </div>
  )
}

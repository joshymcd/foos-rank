import type { Match, TeamColor } from '../collections/matches'
import type { Person } from '../collections/people'

function teamNames(
  match: Pick<Match, 'participants'>,
  people: Person[],
  team: TeamColor,
) {
  return match.participants
    .filter((participant) => participant.team === team)
    .map(
      (participant) =>
        people.find((person) => person.id === participant.personId)?.name ??
        'Unknown player',
    )
    .join(' + ')
}

export function Scoreboard({
  match,
  people,
}: {
  match: Match
  people: Person[]
}) {
  const redNames = teamNames(match, people, 'red')
  const blueNames = teamNames(match, people, 'blue')
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 text-sm">
      <span
        className="truncate text-right font-medium text-team-red"
        title={redNames}
      >
        {redNames}
      </span>
      <div className="text-center">
        {match.score ? (
          <span className="font-display text-lg font-bold tabular-nums text-text">
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
      <span className="truncate font-medium text-team-blue" title={blueNames}>
        {blueNames}
      </span>
    </div>
  )
}

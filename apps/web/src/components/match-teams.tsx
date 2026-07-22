import type { CompletedMatch } from '../collections/matches'
import type { Person } from '../collections/people'

function participantNames(
  match: Pick<CompletedMatch, 'participants'>,
  people: Person[],
  team: 'red' | 'blue',
) {
  return match.participants
    .filter((participant) => participant.team === team)
    .map(
      (participant) =>
        people.find((person) => person.id === participant.personId)?.name ??
        'Unknown',
    )
    .join(' + ')
}

export function MatchTeams({
  match,
  people,
}: {
  match: CompletedMatch
  people: Person[]
}) {
  return (
    <div className="grid gap-2 text-sm sm:grid-cols-[1fr_auto_1fr] sm:items-center">
      <div className="rounded bg-red-50 px-3 py-2 text-red-950">
        <strong>Red</strong> {participantNames(match, people, 'red')}
      </div>
      <div className="text-center font-bold tabular-nums">
        {match.score.red} - {match.score.blue}
      </div>
      <div className="rounded bg-blue-50 px-3 py-2 text-blue-950">
        <strong>Blue</strong> {participantNames(match, people, 'blue')}
      </div>
    </div>
  )
}

import { createFileRoute } from '@tanstack/react-router'
import { useLiveQuery } from '@tanstack/react-db'
import { EmptyOrganization } from '../../components/app-shell'
import { organizationsCollection } from '../../collections/organization'
import { matchesCollection } from '../../collections/matches'
import { peopleCollection } from '../../collections/people'
import { leaderboard } from '../../domain/elo'

export const Route = createFileRoute('/$organizationId/leaderboard')({
  component: Leaderboard,
})
function Leaderboard() {
  const { organizationId } = Route.useParams()
  const organizations = useLiveQuery(() => organizationsCollection).data ?? []
  const organization = organizations.find((item) => item.id === organizationId)
  const people = (useLiveQuery(() => peopleCollection).data ?? []).filter(
    (person) => person.organizationId === organizationId,
  )
  const matches = (useLiveQuery(() => matchesCollection).data ?? []).filter(
    (match) => match.organizationId === organizationId && match.complete,
  )
  if (!organization) return <EmptyOrganization />
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Leaderboard</h1>
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-3">Rank</th>
                <th className="px-5 py-3">Player</th>
                <th className="px-5 py-3 text-right">Elo</th>
                <th className="px-5 py-3 text-right">Played</th>
                <th className="px-5 py-3 text-right">Record</th>
                <th className="px-5 py-3 text-right">Streak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leaderboard(people, matches).map((person) => (
                <tr key={person.id}>
                  <td className="px-5 py-4 font-semibold text-slate-500">
                    #{person.rank}
                  </td>
                  <td className="px-5 py-4 font-medium">{person.name}</td>
                  <td className="px-5 py-4 text-right font-bold tabular-nums">
                    {Math.round(person.elo)}
                  </td>
                  <td className="px-5 py-4 text-right tabular-nums">
                    {person.played}
                  </td>
                  <td className="px-5 py-4 text-right tabular-nums">
                    {person.wins}W - {person.losses}L
                  </td>
                  <td className="px-5 py-4 text-right tabular-nums">
                    {person.streak > 0
                      ? `${person.streak}W`
                      : person.streak < 0
                        ? `${Math.abs(person.streak)}L`
                        : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}

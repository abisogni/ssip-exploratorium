import { getEvents } from '@/lib/events'
import SignalArchiveMobile from './SignalArchiveMobile'

export const metadata = { title: 'event_log — The Exploratorium' }
export const dynamic   = 'force-dynamic'

export default async function EventLogPage() {
  const events = await getEvents()

  // TODO: add SignalArchiveDesktop for ≥768px once designed
  return <SignalArchiveMobile events={events} />
}

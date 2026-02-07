import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetchPeople, fetchPeopleDashboard, createPerson, deletePerson, createInteraction, fetchGroups, fetchPeopleByGroup } from '../api'
import type { Person, ContactFrequency, RelationshipType, InteractionType } from '../types'
import { Card, PageHeader, Section, Button, Input, Select, Badge, EmptyState, FormField } from '../../../shared/components/ui'

const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  friend: 'Friend',
  family: 'Family',
  colleague: 'Colleague',
  acquaintance: 'Acquaintance',
}

const FREQUENCY_LABELS: Record<ContactFrequency, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
  none: 'No reminders',
}

const INTERACTION_LABELS: Record<InteractionType, string> = {
  message: '💬 Message',
  call: '📞 Call',
  video: '📹 Video',
  in_person: '🤝 In Person',
}

function AddPersonModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState('')
  const [nickname, setNickname] = useState('')
  const [relationship, setRelationship] = useState<RelationshipType>('friend')
  const [contactFrequency, setContactFrequency] = useState<ContactFrequency>('monthly')
  const [birthday, setBirthday] = useState('')
  const [location, setLocation] = useState('')
  const [howMet, setHowMet] = useState('')
  const [notes, setNotes] = useState('')

  const mutation = useMutation({
    mutationFn: createPerson,
    onSuccess: () => {
      onSuccess()
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate({
      name,
      nickname: nickname || undefined,
      relationship,
      contact_frequency: contactFrequency,
      birthday: birthday || undefined,
      location: location || undefined,
      how_met: howMet || undefined,
      notes: notes || undefined,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-xl font-semibold">Add Person</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Name *" htmlFor="name">
              <Input
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Full name"
                required
              />
            </FormField>
            <FormField label="Nickname" htmlFor="nickname">
              <Input
                id="nickname"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                placeholder="What you call them"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Relationship" htmlFor="relationship">
              <Select
                id="relationship"
                value={relationship}
                onChange={e => setRelationship(e.target.value as RelationshipType)}
              >
                {Object.entries(RELATIONSHIP_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Contact Frequency" htmlFor="frequency">
              <Select
                id="frequency"
                value={contactFrequency}
                onChange={e => setContactFrequency(e.target.value as ContactFrequency)}
              >
                {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Birthday" htmlFor="birthday">
              <Input
                id="birthday"
                type="date"
                value={birthday}
                onChange={e => setBirthday(e.target.value)}
              />
            </FormField>
            <FormField label="Location" htmlFor="location">
              <Input
                id="location"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="City, Country"
              />
            </FormField>
          </div>

          <FormField label="How did you meet?" htmlFor="howMet">
            <Input
              id="howMet"
              value={howMet}
              onChange={e => setHowMet(e.target.value)}
              placeholder="Work, school, event..."
            />
          </FormField>

          <FormField label="Notes" htmlFor="notes">
            <textarea
              id="notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Things to remember..."
              className="input min-h-[80px]"
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={mutation.isPending}>Add Person</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

function QuickInteractionModal({ 
  person, 
  onClose, 
  onSuccess 
}: { 
  person: Person
  onClose: () => void
  onSuccess: () => void 
}) {
  const [type, setType] = useState<InteractionType>('message')
  const [notes, setNotes] = useState('')

  const mutation = useMutation({
    mutationFn: () => createInteraction(person.id, { type, notes: notes || undefined }),
    onSuccess: () => {
      onSuccess()
      onClose()
    },
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-sm">
        <h2 className="text-lg font-semibold mb-4">Log Interaction with {person.nickname || person.name}</h2>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(INTERACTION_LABELS) as InteractionType[]).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                  type === t 
                    ? 'border-primary-500 bg-primary-50 text-primary-700' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {INTERACTION_LABELS[t]}
              </button>
            ))}
          </div>

          <FormField label="Notes (optional)" htmlFor="notes">
            <Input
              id="notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="What did you talk about?"
            />
          </FormField>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={() => mutation.mutate()} loading={mutation.isPending}>Log</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

function PersonRow({ 
  person, 
  onLogInteraction,
  onDelete
}: { 
  person: Person
  onLogInteraction: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50">
      <div className="flex items-center gap-4 min-w-0">
        {person.photo_url ? (
          <img 
            src={person.photo_url} 
            alt={person.name}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-medium text-primary-700">
              {person.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="min-w-0">
          <Link to={`/people/${person.id}`} className="font-medium text-gray-900 hover:text-primary-600">
            {person.name}
            {person.nickname && <span className="text-gray-500 ml-1">({person.nickname})</span>}
          </Link>
          <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
            <Badge variant="gray">{RELATIONSHIP_LABELS[person.relationship]}</Badge>
            {person.health_score !== undefined && (
              <Badge variant={
                person.health_score >= 80 ? 'success' : 
                person.health_score >= 50 ? 'warning' : 'danger'
              }>
                ❤️ {person.health_score}
              </Badge>
            )}
            {person.current_streak > 0 && (
              <span className="text-primary-600">🔥 {person.current_streak}</span>
            )}
            {person.days_overdue && person.days_overdue > 0 && (
              <Badge variant="warning">{person.days_overdue}d overdue</Badge>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost" onClick={onLogInteraction}>
          📝 Log
        </Button>
        <Button size="sm" variant="ghost" onClick={onDelete}>
          🗑️
        </Button>
      </div>
    </div>
  )
}

export function Dashboard() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [interactionPerson, setInteractionPerson] = useState<Person | null>(null)
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const queryClient = useQueryClient()

  // Fetch groups for filter
  const { data: groups } = useQuery({
    queryKey: ['groups'],
    queryFn: fetchGroups,
  })

  // Fetch people - optionally filtered by group
  const { data: people, isLoading: loadingPeople } = useQuery({
    queryKey: ['people', selectedGroupId],
    queryFn: () => selectedGroupId ? fetchPeopleByGroup(selectedGroupId) : fetchPeople(),
  })

  const { data: dashboard } = useQuery({
    queryKey: ['people-dashboard'],
    queryFn: fetchPeopleDashboard,
  })

  const deleteM = useMutation({
    mutationFn: deletePerson,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] })
      queryClient.invalidateQueries({ queryKey: ['people-dashboard'] })
    },
  })

  const handleDelete = (person: Person) => {
    if (confirm(`Delete ${person.name}? This will also delete all interactions.`)) {
      deleteM.mutate(person.id)
    }
  }

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['people'] })
    queryClient.invalidateQueries({ queryKey: ['people-dashboard'] })
  }

  if (loadingPeople) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  const overdueContacts = dashboard?.overdue_contacts || []
  const upcomingBirthdays = dashboard?.upcoming_birthdays || []

  return (
    <div className="space-y-8">
      <PageHeader
        title="People"
        subtitle={`${people?.length || 0} contacts`}
        actions={
          <Button onClick={() => setShowAddModal(true)}>+ Add Person</Button>
        }
      />

      {/* Alerts */}
      {(overdueContacts.length > 0 || upcomingBirthdays.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {overdueContacts.length > 0 && (
            <Card className="border-warning-200 bg-warning-50">
              <h3 className="font-semibold text-warning-800 mb-2">
                ⏰ {overdueContacts.length} Overdue Contact{overdueContacts.length > 1 ? 's' : ''}
              </h3>
              <ul className="space-y-1">
                {overdueContacts.slice(0, 5).map(p => (
                  <li key={p.id} className="text-sm text-warning-700">
                    <Link to={`/people/${p.id}`} className="hover:underline font-medium">
                      {p.nickname || p.name}
                    </Link>
                    {' '}- {p.days_overdue}d overdue ({p.frequency})
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {upcomingBirthdays.length > 0 && (
            <Card className="border-primary-200 bg-primary-50">
              <h3 className="font-semibold text-primary-800 mb-2">
                🎂 Upcoming Birthdays
              </h3>
              <ul className="space-y-1">
                {upcomingBirthdays.map(b => (
                  <li key={b.id} className="text-sm text-primary-700">
                    <Link to={`/people/${b.id}`} className="hover:underline font-medium">
                      {b.nickname || b.name}
                    </Link>
                    {' '}- {b.days_until === 0 ? 'Today!' : `in ${b.days_until}d`}
                    {b.turning_age && ` (turning ${b.turning_age})`}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}

      {/* People List */}
      <Section 
        title={selectedGroupId ? groups?.find(g => g.id === selectedGroupId)?.name || 'Contacts' : 'All Contacts'}
        actions={
          groups && groups.length > 0 && (
            <Select
              value={selectedGroupId?.toString() || ''}
              onChange={e => setSelectedGroupId(e.target.value ? parseInt(e.target.value, 10) : null)}
              className="text-sm"
            >
              <option value="">All Groups</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.member_count})
                </option>
              ))}
            </Select>
          )
        }
      >
        {!people || people.length === 0 ? (
          <EmptyState
            icon="👥"
            title="No people yet"
            description="Add your first contact to start tracking relationships."
            action={<Button onClick={() => setShowAddModal(true)}>Add Person</Button>}
          />
        ) : (
          <Card padding="none">
            {people.map(person => (
              <PersonRow
                key={person.id}
                person={person}
                onLogInteraction={() => setInteractionPerson(person)}
                onDelete={() => handleDelete(person)}
              />
            ))}
          </Card>
        )}
      </Section>

      {/* Modals */}
      {showAddModal && (
        <AddPersonModal
          onClose={() => setShowAddModal(false)}
          onSuccess={refreshData}
        />
      )}

      {interactionPerson && (
        <QuickInteractionModal
          person={interactionPerson}
          onClose={() => setInteractionPerson(null)}
          onSuccess={refreshData}
        />
      )}
    </div>
  )
}

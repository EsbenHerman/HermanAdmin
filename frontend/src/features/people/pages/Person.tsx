import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  fetchPerson, updatePerson, deletePerson, createInteraction, deleteInteraction, 
  createFact, deleteFact, createLifeEvent, deleteLifeEvent, createSpecialDate, deleteSpecialDate,
  createConnection, deleteConnection, createSocial, deleteSocial, uploadPhoto, fetchPeople
} from '../api'
import type { 
  ContactFrequency, RelationshipType, InteractionType, PersonWithInteractions, 
  FactCategory, EventType, SpecialDateType, ConnectionType, SocialPlatform, Person 
} from '../types'
import { Card, PageHeader, Section, Button, Input, Select, Badge, FormField } from '../../../shared/components/ui'

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

const INTERACTION_ICONS: Record<InteractionType, string> = {
  message: '💬',
  call: '📞',
  video: '📹',
  in_person: '🤝',
}

const FACT_CATEGORY_LABELS: Record<FactCategory, string> = {
  personal: '👤 Personal',
  work: '💼 Work',
  family: '👨‍👩‍👧 Family',
  health: '🏥 Health',
  preference: '⭐ Preference',
  other: '📝 Other',
}

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  job_change: '💼 Job Change',
  moved: '🏠 Moved',
  married: '💍 Married',
  child: '👶 Child',
  graduated: '🎓 Graduated',
  promotion: '📈 Promotion',
  other: '📅 Other',
}

const EVENT_TYPE_ICONS: Record<EventType, string> = {
  job_change: '💼',
  moved: '🏠',
  married: '💍',
  child: '👶',
  graduated: '🎓',
  promotion: '📈',
  other: '📅',
}

const SPECIAL_DATE_LABELS: Record<SpecialDateType, string> = {
  anniversary: '💍 Anniversary',
  child_birthday: '👶 Child Birthday',
  memorial: '🕯️ Memorial',
  custom: '📅 Custom',
}

const SPECIAL_DATE_ICONS: Record<SpecialDateType, string> = {
  anniversary: '💍',
  child_birthday: '👶',
  memorial: '🕯️',
  custom: '📅',
}

// Phase 4: Connection types
const CONNECTION_LABELS: Record<ConnectionType, string> = {
  friends: '👥 Friends',
  colleagues: '💼 Colleagues',
  family: '👨‍👩‍👧 Family',
  introduced_by: '🤝 Introduced by',
}

// Phase 5: Social platforms
const SOCIAL_LABELS: Record<SocialPlatform, string> = {
  instagram: '📸 Instagram',
  linkedin: '💼 LinkedIn',
  twitter: '🐦 Twitter/X',
  facebook: '📘 Facebook',
  wechat: '💬 WeChat',
  other: '🔗 Other',
}

const SOCIAL_ICONS: Record<SocialPlatform, string> = {
  instagram: '📸',
  linkedin: '💼',
  twitter: '🐦',
  facebook: '📘',
  wechat: '💬',
  other: '🔗',
}

function EditPersonModal({ 
  person, 
  onClose, 
  onSuccess 
}: { 
  person: PersonWithInteractions
  onClose: () => void
  onSuccess: () => void 
}) {
  const [name, setName] = useState(person.name)
  const [nickname, setNickname] = useState(person.nickname || '')
  const [relationship, setRelationship] = useState<RelationshipType>(person.relationship)
  const [contactFrequency, setContactFrequency] = useState<ContactFrequency>(person.contact_frequency)
  const [birthday, setBirthday] = useState(person.birthday || '')
  const [location, setLocation] = useState(person.location || '')
  const [email, setEmail] = useState(person.email || '')
  const [phone, setPhone] = useState(person.phone || '')
  const [howMet, setHowMet] = useState(person.how_met || '')
  const [notes, setNotes] = useState(person.notes || '')

  const mutation = useMutation({
    mutationFn: () => updatePerson(person.id, {
      name,
      nickname: nickname || undefined,
      relationship,
      contact_frequency: contactFrequency,
      birthday: birthday || undefined,
      location: location || undefined,
      email: email || undefined,
      phone: phone || undefined,
      how_met: howMet || undefined,
      notes: notes || undefined,
    }),
    onSuccess: () => {
      onSuccess()
      onClose()
    },
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={e => { e.preventDefault(); mutation.mutate() }} className="space-y-4">
          <h2 className="text-xl font-semibold">Edit Person</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Name *" htmlFor="name">
              <Input
                id="name"
                value={name}
                onChange={e => { setName(e.target.value); }}
                required
              />
            </FormField>
            <FormField label="Nickname" htmlFor="nickname">
              <Input
                id="nickname"
                value={nickname}
                onChange={e => { setNickname(e.target.value); }}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Relationship" htmlFor="relationship">
              <Select
                id="relationship"
                value={relationship}
                onChange={e => { setRelationship(e.target.value as RelationshipType); }}
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
                onChange={e => { setContactFrequency(e.target.value as ContactFrequency); }}
              >
                {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Email" htmlFor="email">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); }}
              />
            </FormField>
            <FormField label="Phone" htmlFor="phone">
              <Input
                id="phone"
                value={phone}
                onChange={e => { setPhone(e.target.value); }}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Birthday" htmlFor="birthday">
              <Input
                id="birthday"
                type="date"
                value={birthday}
                onChange={e => { setBirthday(e.target.value); }}
              />
            </FormField>
            <FormField label="Location" htmlFor="location">
              <Input
                id="location"
                value={location}
                onChange={e => { setLocation(e.target.value); }}
              />
            </FormField>
          </div>

          <FormField label="How did you meet?" htmlFor="howMet">
            <Input
              id="howMet"
              value={howMet}
              onChange={e => { setHowMet(e.target.value); }}
            />
          </FormField>

          <FormField label="Notes" htmlFor="notes">
            <textarea
              id="notes"
              value={notes}
              onChange={e => { setNotes(e.target.value); }}
              className="input min-h-[80px]"
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={mutation.isPending}>Save</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

function AddInteractionModal({ 
  personId, 
  onClose, 
  onSuccess 
}: { 
  personId: number
  onClose: () => void
  onSuccess: () => void 
}) {
  const [type, setType] = useState<InteractionType>('message')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [topics, setTopics] = useState('')

  const mutation = useMutation({
    mutationFn: () => createInteraction(personId, { 
      type, 
      date, 
      notes: notes || undefined,
      topics: topics || undefined 
    }),
    onSuccess: () => {
      onSuccess()
      onClose()
    },
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-sm">
        <h2 className="text-lg font-semibold mb-4">Log Interaction</h2>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(INTERACTION_LABELS) as InteractionType[]).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => { setType(t); }}
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

          <FormField label="Date" htmlFor="date">
            <Input
              id="date"
              type="date"
              value={date}
              onChange={e => { setDate(e.target.value); }}
            />
          </FormField>

          <FormField label="Topics discussed" htmlFor="topics">
            <Input
              id="topics"
              value={topics}
              onChange={e => { setTopics(e.target.value); }}
              placeholder="Work, travel plans, movies..."
            />
          </FormField>

          <FormField label="Notes (optional)" htmlFor="notes">
            <textarea
              id="notes"
              value={notes}
              onChange={e => { setNotes(e.target.value); }}
              placeholder="Any other details..."
              className="input min-h-[60px]"
            />
          </FormField>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={() => { mutation.mutate(); }} loading={mutation.isPending}>Log</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

function AddFactModal({ 
  personId, 
  onClose, 
  onSuccess 
}: { 
  personId: number
  onClose: () => void
  onSuccess: () => void 
}) {
  const [fact, setFact] = useState('')
  const [category, setCategory] = useState<FactCategory>('other')

  const mutation = useMutation({
    mutationFn: () => createFact(personId, { fact, category }),
    onSuccess: () => {
      onSuccess()
      onClose()
    },
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-sm">
        <h2 className="text-lg font-semibold mb-4">Add Key Fact</h2>
        
        <div className="space-y-4">
          <FormField label="Category" htmlFor="category">
            <Select
              id="category"
              value={category}
              onChange={e => { setCategory(e.target.value as FactCategory); }}
            >
              {Object.entries(FACT_CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </FormField>

          <FormField label="Fact" htmlFor="fact">
            <textarea
              id="fact"
              value={fact}
              onChange={e => { setFact(e.target.value); }}
              placeholder="Important thing to remember..."
              className="input min-h-[80px]"
              required
            />
          </FormField>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={() => { mutation.mutate(); }} loading={mutation.isPending} disabled={!fact.trim()}>Add</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

function AddLifeEventModal({ 
  personId, 
  onClose, 
  onSuccess 
}: { 
  personId: number
  onClose: () => void
  onSuccess: () => void 
}) {
  const [eventType, setEventType] = useState<EventType>('other')
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')

  const mutation = useMutation({
    mutationFn: () => createLifeEvent(personId, { 
      event_type: eventType, 
      title, 
      date, 
      notes: notes || undefined 
    }),
    onSuccess: () => {
      onSuccess()
      onClose()
    },
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-sm">
        <h2 className="text-lg font-semibold mb-4">Add Life Event</h2>
        
        <div className="space-y-4">
          <FormField label="Event Type" htmlFor="eventType">
            <Select
              id="eventType"
              value={eventType}
              onChange={e => { setEventType(e.target.value as EventType); }}
            >
              {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </FormField>

          <FormField label="Title" htmlFor="title">
            <Input
              id="title"
              value={title}
              onChange={e => { setTitle(e.target.value); }}
              placeholder="Started at Google, Moved to London..."
              required
            />
          </FormField>

          <FormField label="Date" htmlFor="eventDate">
            <Input
              id="eventDate"
              type="date"
              value={date}
              onChange={e => { setDate(e.target.value); }}
            />
          </FormField>

          <FormField label="Notes (optional)" htmlFor="eventNotes">
            <textarea
              id="eventNotes"
              value={notes}
              onChange={e => { setNotes(e.target.value); }}
              placeholder="Any details..."
              className="input min-h-[60px]"
            />
          </FormField>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={() => { mutation.mutate(); }} loading={mutation.isPending} disabled={!title.trim()}>Add</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

function AddSpecialDateModal({ 
  personId, 
  onClose, 
  onSuccess 
}: { 
  personId: number
  onClose: () => void
  onSuccess: () => void 
}) {
  const [dateType, setDateType] = useState<SpecialDateType>('custom')
  const [label, setLabel] = useState('')
  const [date, setDate] = useState('')  // MM-DD format

  const mutation = useMutation({
    mutationFn: () => createSpecialDate(personId, { 
      date_type: dateType, 
      label, 
      date,
      recurring: true
    }),
    onSuccess: () => {
      onSuccess()
      onClose()
    },
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-sm">
        <h2 className="text-lg font-semibold mb-4">Add Special Date</h2>
        
        <div className="space-y-4">
          <FormField label="Type" htmlFor="dateType">
            <Select
              id="dateType"
              value={dateType}
              onChange={e => { setDateType(e.target.value as SpecialDateType); }}
            >
              {Object.entries(SPECIAL_DATE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </FormField>

          <FormField label="Label" htmlFor="dateLabel">
            <Input
              id="dateLabel"
              value={label}
              onChange={e => { setLabel(e.target.value); }}
              placeholder="Wedding anniversary, Emma's birthday..."
              required
            />
          </FormField>

          <FormField label="Date (MM-DD)" htmlFor="dateValue">
            <Input
              id="dateValue"
              value={date}
              onChange={e => { setDate(e.target.value); }}
              placeholder="06-15"
              pattern="\d{2}-\d{2}"
              required
            />
          </FormField>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={() => { mutation.mutate(); }} loading={mutation.isPending} disabled={!label.trim() || !date}>Add</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

// Phase 4: Add Connection Modal
function AddConnectionModal({ 
  personId, 
  onClose, 
  onSuccess 
}: { 
  personId: number
  onClose: () => void
  onSuccess: () => void 
}) {
  const [selectedPersonId, setSelectedPersonId] = useState<number>(0)
  const [relationship, setRelationship] = useState<ConnectionType>('friends')
  const [notes, setNotes] = useState('')

  const { data: people } = useQuery({
    queryKey: ['people'],
    queryFn: fetchPeople,
  })

  const mutation = useMutation({
    mutationFn: () => createConnection(personId, { 
      person_b_id: selectedPersonId, 
      relationship, 
      notes: notes || undefined 
    }),
    onSuccess: () => {
      onSuccess()
      onClose()
    },
  })

  // Filter out the current person from the list
  const availablePeople = people?.filter(p => p.id !== personId) || []

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-sm">
        <h2 className="text-lg font-semibold mb-4">Add Connection</h2>
        
        <div className="space-y-4">
          <FormField label="Connected Person" htmlFor="connectedPerson">
            <Select
              id="connectedPerson"
              value={selectedPersonId.toString()}
              onChange={e => { setSelectedPersonId(parseInt(e.target.value, 10)); }}
            >
              <option value="0">Select a person...</option>
              {availablePeople.map(p => (
                <option key={p.id} value={p.id}>{p.name}{p.nickname ? ` (${p.nickname})` : ''}</option>
              ))}
            </Select>
          </FormField>

          <FormField label="Relationship" htmlFor="connRelationship">
            <Select
              id="connRelationship"
              value={relationship}
              onChange={e => { setRelationship(e.target.value as ConnectionType); }}
            >
              {Object.entries(CONNECTION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </FormField>

          <FormField label="Notes (optional)" htmlFor="connNotes">
            <Input
              id="connNotes"
              value={notes}
              onChange={e => { setNotes(e.target.value); }}
              placeholder="How they know each other..."
            />
          </FormField>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={() => { mutation.mutate(); }} loading={mutation.isPending} disabled={!selectedPersonId}>Add</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

// Phase 5: Add Social Modal
function AddSocialModal({ 
  personId, 
  onClose, 
  onSuccess 
}: { 
  personId: number
  onClose: () => void
  onSuccess: () => void 
}) {
  const [platform, setPlatform] = useState<SocialPlatform>('instagram')
  const [handle, setHandle] = useState('')
  const [url, setUrl] = useState('')

  const mutation = useMutation({
    mutationFn: () => createSocial(personId, { 
      platform, 
      handle, 
      url: url || undefined 
    }),
    onSuccess: () => {
      onSuccess()
      onClose()
    },
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-sm">
        <h2 className="text-lg font-semibold mb-4">Add Social Profile</h2>
        
        <div className="space-y-4">
          <FormField label="Platform" htmlFor="platform">
            <Select
              id="platform"
              value={platform}
              onChange={e => { setPlatform(e.target.value as SocialPlatform); }}
            >
              {Object.entries(SOCIAL_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </FormField>

          <FormField label="Handle / Username" htmlFor="handle">
            <Input
              id="handle"
              value={handle}
              onChange={e => { setHandle(e.target.value); }}
              placeholder="@username"
              required
            />
          </FormField>

          <FormField label="Profile URL (optional)" htmlFor="socialUrl">
            <Input
              id="socialUrl"
              value={url}
              onChange={e => { setUrl(e.target.value); }}
              placeholder="https://..."
            />
          </FormField>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={() => { mutation.mutate(); }} loading={mutation.isPending} disabled={!handle.trim()}>Add</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export function Person() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddInteraction, setShowAddInteraction] = useState(false)
  const [showAddFact, setShowAddFact] = useState(false)
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [showAddSpecialDate, setShowAddSpecialDate] = useState(false)
  const [showAddConnection, setShowAddConnection] = useState(false)
  const [showAddSocial, setShowAddSocial] = useState(false)

  const personId = parseInt(id || '0', 10)

  const { data: person, isLoading, error } = useQuery({
    queryKey: ['person', personId],
    queryFn: () => fetchPerson(personId),
    enabled: personId > 0,
  })

  const deletePersonM = useMutation({
    mutationFn: () => deletePerson(personId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['people'] })
      navigate('/people')
    },
  })

  const deleteInteractionM = useMutation({
    mutationFn: (interactionId: number) => deleteInteraction(personId, interactionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['person', personId] })
    },
  })

  const deleteFactM = useMutation({
    mutationFn: (factId: number) => deleteFact(personId, factId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['person', personId] })
    },
  })

  const deleteEventM = useMutation({
    mutationFn: (eventId: number) => deleteLifeEvent(personId, eventId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['person', personId] })
    },
  })

  const deleteSpecialDateM = useMutation({
    mutationFn: (dateId: number) => deleteSpecialDate(personId, dateId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['person', personId] })
    },
  })

  // Phase 4: Connection mutations
  const deleteConnectionM = useMutation({
    mutationFn: (connectionId: number) => deleteConnection(personId, connectionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['person', personId] })
    },
  })

  // Phase 5: Social mutations
  const deleteSocialM = useMutation({
    mutationFn: (socialId: number) => deleteSocial(personId, socialId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['person', personId] })
    },
  })

  // Phase 5: Photo upload mutation
  const uploadPhotoM = useMutation({
    mutationFn: (file: File) => uploadPhoto(personId, file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['person', personId] })
    },
  })

  const refreshData = () => {
    void queryClient.invalidateQueries({ queryKey: ['person', personId] })
    void queryClient.invalidateQueries({ queryKey: ['people'] })
  }

  const handleDeletePerson = () => {
    if (confirm(`Delete ${person?.name ?? 'this person'}? This will also delete all interactions.`)) {
      deletePersonM.mutate()
    }
  }

  const handleDeleteInteraction = (interactionId: number) => {
    if (confirm('Delete this interaction?')) {
      deleteInteractionM.mutate(interactionId)
    }
  }

  const handleDeleteFact = (factId: number) => {
    if (confirm('Delete this fact?')) {
      deleteFactM.mutate(factId)
    }
  }

  const handleDeleteEvent = (eventId: number) => {
    if (confirm('Delete this life event?')) {
      deleteEventM.mutate(eventId)
    }
  }

  const handleDeleteSpecialDate = (dateId: number) => {
    if (confirm('Delete this special date?')) {
      deleteSpecialDateM.mutate(dateId)
    }
  }

  const handleDeleteConnection = (connectionId: number) => {
    if (confirm('Delete this connection?')) {
      deleteConnectionM.mutate(connectionId)
    }
  }

  const handleDeleteSocial = (socialId: number) => {
    if (confirm('Delete this social profile?')) {
      deleteSocialM.mutate(socialId)
    }
  }

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      uploadPhotoM.mutate(file)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (error || !person) {
    return (
      <Card className="bg-danger-50 border-danger-200">
        <p className="text-danger-800">Person not found</p>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* Photo + Header */}
      <div className="flex items-start gap-6">
        {/* Photo Avatar (Phase 5) */}
        <div className="flex-shrink-0">
          <div className="relative group">
            {person.photo_url ? (
              <img 
                src={person.photo_url} 
                alt={person.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center border-4 border-white shadow-lg">
                <span className="text-3xl font-bold text-primary-700">
                  {person.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
              <span className="text-white text-sm">📷</span>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handlePhotoUpload}
              />
            </label>
          </div>
        </div>
        
        <div className="flex-1">
          <PageHeader
            title={person.name}
            subtitle={person.nickname ? `"${person.nickname}"` : undefined}
            backLink="/people"
            backLabel="← All People"
            actions={
              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={() => { setShowEditModal(true); }}>Edit</Button>
                <Button variant="danger" onClick={handleDeletePerson}>Delete</Button>
              </div>
            }
          />
          {/* Introduced By (Phase 4) */}
          {person.introduced_by_id && person.introduced_by_name && (
            <p className="text-sm text-gray-500 mt-2">
              Introduced by{' '}
              <Link to={`/people/${person.introduced_by_id}`} className="text-primary-600 hover:underline">
                {person.introduced_by_name}
              </Link>
            </p>
          )}
        </div>
      </div>

      {/* Health & Streak Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Health Score */}
        <Card padding="sm" className="text-center">
          <p className="text-sm text-gray-500 mb-1">Health Score</p>
          <p className={`text-2xl font-bold ${
            (person.health_score ?? 0) >= 80 ? 'text-success-600' :
            (person.health_score ?? 0) >= 50 ? 'text-warning-600' : 'text-danger-600'
          }`}>
            {person.health_score ?? 0}
          </p>
        </Card>
        
        {/* Current Streak */}
        <Card padding="sm" className="text-center">
          <p className="text-sm text-gray-500 mb-1">Current Streak</p>
          <p className="text-2xl font-bold text-primary-600">
            {person.current_streak > 0 ? `🔥 ${person.current_streak}` : '—'}
          </p>
        </Card>
        
        {/* Longest Streak */}
        <Card padding="sm" className="text-center">
          <p className="text-sm text-gray-500 mb-1">Best Streak</p>
          <p className="text-2xl font-bold text-gray-700">
            {person.longest_streak > 0 ? `🏆 ${person.longest_streak}` : '—'}
          </p>
        </Card>
        
        {/* Last Contact */}
        <Card padding="sm" className="text-center">
          <p className="text-sm text-gray-500 mb-1">Last Contact</p>
          <p className="text-lg font-medium text-gray-900">
            {person.last_contact || 'Never'}
          </p>
        </Card>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Details */}
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">Details</h3>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-gray-500">Relationship</dt>
              <dd><Badge variant="primary">{RELATIONSHIP_LABELS[person.relationship]}</Badge></dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Contact Frequency</dt>
              <dd className="font-medium">{FREQUENCY_LABELS[person.contact_frequency]}</dd>
            </div>
            {person.birthday && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Birthday</dt>
                <dd className="font-medium">
                  {person.birthday}
                  {person.birthday_lunar && (
                    <span className="text-gray-400 ml-1">(lunar)</span>
                  )}
                  {person.birthday_gregorian && (
                    <span className="text-gray-500 block text-sm">
                      ≈ {person.birthday_gregorian} (this year)
                    </span>
                  )}
                </dd>
              </div>
            )}
            {person.location && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Location</dt>
                <dd className="font-medium">{person.location}</dd>
              </div>
            )}
            {person.email && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Email</dt>
                <dd><a href={`mailto:${person.email}`} className="text-primary-600 hover:underline">{person.email}</a></dd>
              </div>
            )}
            {person.phone && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Phone</dt>
                <dd><a href={`tel:${person.phone}`} className="text-primary-600 hover:underline">{person.phone}</a></dd>
              </div>
            )}
          </dl>
        </Card>

        {/* Context */}
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">Context</h3>
          {person.how_met && (
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-1">How you met</p>
              <p className="text-gray-900">{person.how_met}</p>
            </div>
          )}
          {person.notes && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Notes</p>
              <p className="text-gray-900 whitespace-pre-wrap">{person.notes}</p>
            </div>
          )}
          {!person.how_met && !person.notes && (
            <p className="text-gray-400 italic">No context added yet.</p>
          )}
        </Card>
      </div>

      {/* Key Facts */}
      <Section 
        title="Key Facts" 
        subtitle="Important things to remember"
        actions={
          <Button size="sm" onClick={() => { setShowAddFact(true); }}>+ Add Fact</Button>
        }
      >
        {!person.facts || person.facts.length === 0 ? (
          <Card className="text-center py-6">
            <p className="text-gray-500 mb-3">No key facts recorded yet.</p>
            <Button size="sm" onClick={() => { setShowAddFact(true); }}>Add First Fact</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {person.facts.map(fact => (
              <Card key={fact.id} padding="sm" className="flex items-start justify-between gap-2">
                <div>
                  <Badge variant="gray" className="mb-1">{FACT_CATEGORY_LABELS[fact.category]}</Badge>
                  <p className="text-gray-900">{fact.fact}</p>
                </div>
                <Button size="xs" variant="ghost" onClick={() => { handleDeleteFact(fact.id); }}>🗑️</Button>
              </Card>
            ))}
          </div>
        )}
      </Section>

      {/* Life Events */}
      <Section 
        title="Life Events" 
        subtitle="Major milestones"
        actions={
          <Button size="sm" onClick={() => { setShowAddEvent(true); }}>+ Add Event</Button>
        }
      >
        {!person.life_events || person.life_events.length === 0 ? (
          <Card className="text-center py-6">
            <p className="text-gray-500 mb-3">No life events recorded yet.</p>
            <Button size="sm" onClick={() => { setShowAddEvent(true); }}>Add First Event</Button>
          </Card>
        ) : (
          <Card padding="none">
            {person.life_events.map(event => (
              <div 
                key={event.id} 
                className="flex items-start justify-between p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <span>{EVENT_TYPE_ICONS[event.event_type]}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{event.title}</p>
                    <p className="text-sm text-gray-500">{event.date}</p>
                    {event.notes && (
                      <p className="text-sm text-gray-600 mt-1">{event.notes}</p>
                    )}
                  </div>
                </div>
                <Button size="xs" variant="ghost" onClick={() => { handleDeleteEvent(event.id); }}>🗑️</Button>
              </div>
            ))}
          </Card>
        )}
      </Section>

      {/* Special Dates */}
      <Section 
        title="Special Dates" 
        subtitle="Recurring dates to remember"
        actions={
          <Button size="sm" onClick={() => { setShowAddSpecialDate(true); }}>+ Add Date</Button>
        }
      >
        {!person.special_dates || person.special_dates.length === 0 ? (
          <Card className="text-center py-6">
            <p className="text-gray-500 mb-3">No special dates added yet.</p>
            <Button size="sm" onClick={() => { setShowAddSpecialDate(true); }}>Add First Date</Button>
          </Card>
        ) : (
          <Card padding="none">
            {person.special_dates.map(date => (
              <div 
                key={date.id} 
                className="flex items-start justify-between p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <span>{SPECIAL_DATE_ICONS[date.date_type]}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{date.label}</p>
                    <p className="text-sm text-gray-500">{date.date} (every year)</p>
                  </div>
                </div>
                <Button size="xs" variant="ghost" onClick={() => { handleDeleteSpecialDate(date.id); }}>🗑️</Button>
              </div>
            ))}
          </Card>
        )}
      </Section>

      {/* Connections (Phase 4) */}
      <Section 
        title="Connections" 
        subtitle="Who they know"
        actions={
          <Button size="sm" onClick={() => { setShowAddConnection(true); }}>+ Add Connection</Button>
        }
      >
        {!person.connections || person.connections.length === 0 ? (
          <Card className="text-center py-6">
            <p className="text-gray-500 mb-3">No connections added yet.</p>
            <Button size="sm" onClick={() => { setShowAddConnection(true); }}>Add First Connection</Button>
          </Card>
        ) : (
          <Card padding="none">
            {person.connections.map(conn => (
              <div 
                key={conn.id} 
                className="flex items-start justify-between p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-700 font-medium">
                      {conn.connected_person_name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <Link 
                      to={`/people/${conn.connected_person_id}`} 
                      className="font-medium text-primary-600 hover:underline"
                    >
                      {conn.connected_person_name}
                    </Link>
                    <Badge variant="gray" className="ml-2">{CONNECTION_LABELS[conn.relationship]}</Badge>
                    {conn.notes && (
                      <p className="text-sm text-gray-600 mt-1">{conn.notes}</p>
                    )}
                  </div>
                </div>
                <Button size="xs" variant="ghost" onClick={() => { handleDeleteConnection(conn.id); }}>🗑️</Button>
              </div>
            ))}
          </Card>
        )}
      </Section>

      {/* Social Profiles (Phase 5) */}
      <Section 
        title="Social Profiles" 
        subtitle="Connect on social media"
        actions={
          <Button size="sm" onClick={() => { setShowAddSocial(true); }}>+ Add Profile</Button>
        }
      >
        {!person.socials || person.socials.length === 0 ? (
          <Card className="text-center py-6">
            <p className="text-gray-500 mb-3">No social profiles added yet.</p>
            <Button size="sm" onClick={() => { setShowAddSocial(true); }}>Add First Profile</Button>
          </Card>
        ) : (
          <div className="flex flex-wrap gap-3">
            {person.socials.map(social => (
              <Card key={social.id} padding="sm" className="flex items-center gap-2">
                <span className="text-lg">{SOCIAL_ICONS[social.platform]}</span>
                {social.url ? (
                  <a 
                    href={social.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline"
                  >
                    @{social.handle}
                  </a>
                ) : (
                  <span className="text-gray-700">@{social.handle}</span>
                )}
                <Button size="xs" variant="ghost" onClick={() => { handleDeleteSocial(social.id); }}>×</Button>
              </Card>
            ))}
          </div>
        )}
      </Section>

      {/* Interactions */}
      <Section 
        title="Interactions" 
        subtitle={`${person.interactions?.length || 0} logged`}
        actions={
          <Button size="sm" onClick={() => { setShowAddInteraction(true); }}>+ Log Interaction</Button>
        }
      >
        {!person.interactions || person.interactions.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-gray-500 mb-4">No interactions logged yet.</p>
            <Button onClick={() => { setShowAddInteraction(true); }}>Log First Interaction</Button>
          </Card>
        ) : (
          <Card padding="none">
            {person.interactions.map(interaction => (
              <div 
                key={interaction.id} 
                className="flex items-start justify-between p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <span>{INTERACTION_ICONS[interaction.type]}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {INTERACTION_LABELS[interaction.type].replace(/^.+\s/, '')}
                    </p>
                    <p className="text-sm text-gray-500">{interaction.date}</p>
                    {interaction.topics && (
                      <p className="text-sm text-primary-600 mt-1">💬 {interaction.topics}</p>
                    )}
                    {interaction.notes && (
                      <p className="text-sm text-gray-600 mt-1">{interaction.notes}</p>
                    )}
                  </div>
                </div>
                <Button 
                  size="xs" 
                  variant="ghost" 
                  onClick={() => { handleDeleteInteraction(interaction.id); }}
                >
                  🗑️
                </Button>
              </div>
            ))}
          </Card>
        )}
      </Section>

      {/* Modals */}
      {showEditModal && (
        <EditPersonModal
          person={person}
          onClose={() => { setShowEditModal(false); }}
          onSuccess={refreshData}
        />
      )}

      {showAddInteraction && (
        <AddInteractionModal
          personId={personId}
          onClose={() => { setShowAddInteraction(false); }}
          onSuccess={refreshData}
        />
      )}

      {showAddFact && (
        <AddFactModal
          personId={personId}
          onClose={() => { setShowAddFact(false); }}
          onSuccess={refreshData}
        />
      )}

      {showAddEvent && (
        <AddLifeEventModal
          personId={personId}
          onClose={() => { setShowAddEvent(false); }}
          onSuccess={refreshData}
        />
      )}

      {showAddSpecialDate && (
        <AddSpecialDateModal
          personId={personId}
          onClose={() => { setShowAddSpecialDate(false); }}
          onSuccess={refreshData}
        />
      )}

      {showAddConnection && (
        <AddConnectionModal
          personId={personId}
          onClose={() => { setShowAddConnection(false); }}
          onSuccess={refreshData}
        />
      )}

      {showAddSocial && (
        <AddSocialModal
          personId={personId}
          onClose={() => { setShowAddSocial(false); }}
          onSuccess={refreshData}
        />
      )}
    </div>
  )
}

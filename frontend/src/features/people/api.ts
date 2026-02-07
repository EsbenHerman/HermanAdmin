import { API_BASE, handleResponse } from '../../shared/api/client'
import type { 
  Person, 
  PersonWithInteractions, 
  Interaction, 
  OverduePerson, 
  UpcomingBirthday,
  PeopleDashboard,
  ContactFrequency,
  RelationshipType,
  InteractionType,
  Fact,
  FactCategory,
  LifeEvent,
  EventType,
  SpecialDate,
  SpecialDateType,
  Suggestion,
  ReconnectCandidate,
  UpcomingDate,
  NearbyPerson,
  Connection,
  ConnectionType,
  Social,
  SocialPlatform,
  Group,
  GroupWithMembers,
  GroupMember,
  ImportResult
} from './types'

// People
export const fetchPeople = (): Promise<Person[]> =>
  fetch(`${API_BASE}/people`).then(r => handleResponse<Person[]>(r)).then(data => data || [])

export const fetchPerson = (id: number): Promise<PersonWithInteractions> =>
  fetch(`${API_BASE}/people/${id}`).then(r => handleResponse<PersonWithInteractions>(r))

export interface CreatePersonRequest {
  name: string
  nickname?: string
  relationship: RelationshipType
  email?: string
  phone?: string
  birthday?: string
  birthday_lunar?: boolean
  location?: string
  how_met?: string
  notes?: string
  contact_frequency: ContactFrequency
}

export const createPerson = (person: CreatePersonRequest): Promise<Person> =>
  fetch(`${API_BASE}/people`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(person),
  }).then(r => handleResponse(r))

export const updatePerson = (id: number, person: CreatePersonRequest): Promise<Person> =>
  fetch(`${API_BASE}/people/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(person),
  }).then(r => handleResponse(r))

export const deletePerson = (id: number): Promise<void> =>
  fetch(`${API_BASE}/people/${id}`, { method: 'DELETE' }).then(r => {
    if (!r.ok) throw new Error('Failed to delete')
  })

// Interactions
export interface CreateInteractionRequest {
  date?: string  // YYYY-MM-DD, defaults to today
  type: InteractionType
  notes?: string
  topics?: string  // What you talked about
}

export const createInteraction = (personId: number, interaction: CreateInteractionRequest): Promise<Interaction> =>
  fetch(`${API_BASE}/people/${personId}/interactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(interaction),
  }).then(r => handleResponse(r))

export const deleteInteraction = (personId: number, interactionId: number): Promise<void> =>
  fetch(`${API_BASE}/people/${personId}/interactions/${interactionId}`, { method: 'DELETE' }).then(r => {
    if (!r.ok) throw new Error('Failed to delete')
  })

// Queries
export const fetchOverdue = (): Promise<OverduePerson[]> =>
  fetch(`${API_BASE}/people/overdue`).then(r => handleResponse<OverduePerson[]>(r)).then(data => data || [])

export const fetchBirthdays = (): Promise<UpcomingBirthday[]> =>
  fetch(`${API_BASE}/people/birthdays`).then(r => handleResponse<UpcomingBirthday[]>(r)).then(data => data || [])

export const fetchPeopleDashboard = (): Promise<PeopleDashboard> =>
  fetch(`${API_BASE}/dashboard/people`).then(r => handleResponse<PeopleDashboard>(r))

// Facts
export interface CreateFactRequest {
  fact: string
  category: FactCategory
}

export const fetchFacts = (personId: number): Promise<Fact[]> =>
  fetch(`${API_BASE}/people/${personId}/facts`).then(r => handleResponse<Fact[]>(r)).then(data => data || [])

export const createFact = (personId: number, fact: CreateFactRequest): Promise<Fact> =>
  fetch(`${API_BASE}/people/${personId}/facts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fact),
  }).then(r => handleResponse(r))

export const deleteFact = (personId: number, factId: number): Promise<void> =>
  fetch(`${API_BASE}/people/${personId}/facts/${factId}`, { method: 'DELETE' }).then(r => {
    if (!r.ok) throw new Error('Failed to delete')
  })

// Life Events
export interface CreateLifeEventRequest {
  event_type: EventType
  title: string
  date: string  // YYYY-MM-DD
  notes?: string
}

export const fetchLifeEvents = (personId: number): Promise<LifeEvent[]> =>
  fetch(`${API_BASE}/people/${personId}/events`).then(r => handleResponse<LifeEvent[]>(r)).then(data => data || [])

export const createLifeEvent = (personId: number, event: CreateLifeEventRequest): Promise<LifeEvent> =>
  fetch(`${API_BASE}/people/${personId}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  }).then(r => handleResponse(r))

export const deleteLifeEvent = (personId: number, eventId: number): Promise<void> =>
  fetch(`${API_BASE}/people/${personId}/events/${eventId}`, { method: 'DELETE' }).then(r => {
    if (!r.ok) throw new Error('Failed to delete')
  })

// Special Dates
export interface CreateSpecialDateRequest {
  date_type: SpecialDateType
  label: string
  date: string  // MM-DD
  recurring?: boolean
}

export const fetchSpecialDates = (personId: number): Promise<SpecialDate[]> =>
  fetch(`${API_BASE}/people/${personId}/dates`).then(r => handleResponse<SpecialDate[]>(r)).then(data => data || [])

export const createSpecialDate = (personId: number, date: CreateSpecialDateRequest): Promise<SpecialDate> =>
  fetch(`${API_BASE}/people/${personId}/dates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(date),
  }).then(r => handleResponse(r))

export const deleteSpecialDate = (personId: number, dateId: number): Promise<void> =>
  fetch(`${API_BASE}/people/${personId}/dates/${dateId}`, { method: 'DELETE' }).then(r => {
    if (!r.ok) throw new Error('Failed to delete')
  })

// Proactive Features
export const fetchSuggestions = (): Promise<Suggestion[]> =>
  fetch(`${API_BASE}/people/suggestions`).then(r => handleResponse<Suggestion[]>(r)).then(data => data || [])

export const fetchReconnect = (): Promise<ReconnectCandidate[]> =>
  fetch(`${API_BASE}/people/reconnect`).then(r => handleResponse<ReconnectCandidate[]>(r)).then(data => data || [])

export const fetchUpcomingDates = (): Promise<UpcomingDate[]> =>
  fetch(`${API_BASE}/people/dates/upcoming`).then(r => handleResponse<UpcomingDate[]>(r)).then(data => data || [])

export const fetchNearby = (location: string): Promise<NearbyPerson[]> =>
  fetch(`${API_BASE}/people/nearby?location=${encodeURIComponent(location)}`).then(r => handleResponse<NearbyPerson[]>(r)).then(data => data || [])

// Phase 4: Connections
export interface CreateConnectionRequest {
  person_b_id: number
  relationship: ConnectionType
  notes?: string
}

export const fetchConnections = (personId: number): Promise<Connection[]> =>
  fetch(`${API_BASE}/people/${personId}/connections`).then(r => handleResponse<Connection[]>(r)).then(data => data || [])

export const createConnection = (personId: number, connection: CreateConnectionRequest): Promise<Connection> =>
  fetch(`${API_BASE}/people/${personId}/connections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(connection),
  }).then(r => handleResponse(r))

export const deleteConnection = (personId: number, connectionId: number): Promise<void> =>
  fetch(`${API_BASE}/people/${personId}/connections/${connectionId}`, { method: 'DELETE' }).then(r => {
    if (!r.ok) throw new Error('Failed to delete')
  })

// Phase 5: Groups
export interface CreateGroupRequest {
  name: string
  color?: string
  default_frequency?: ContactFrequency
}

export const fetchGroups = (): Promise<Group[]> =>
  fetch(`${API_BASE}/groups`).then(r => handleResponse<Group[]>(r)).then(data => data || [])

export const fetchGroup = (id: number): Promise<GroupWithMembers> =>
  fetch(`${API_BASE}/groups/${id}`).then(r => handleResponse<GroupWithMembers>(r))

export const createGroup = (group: CreateGroupRequest): Promise<Group> =>
  fetch(`${API_BASE}/groups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(group),
  }).then(r => handleResponse(r))

export const updateGroup = (id: number, group: CreateGroupRequest): Promise<Group> =>
  fetch(`${API_BASE}/groups/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(group),
  }).then(r => handleResponse(r))

export const deleteGroup = (id: number): Promise<void> =>
  fetch(`${API_BASE}/groups/${id}`, { method: 'DELETE' }).then(r => {
    if (!r.ok) throw new Error('Failed to delete')
  })

export const addGroupMember = (groupId: number, personId: number): Promise<GroupMember> =>
  fetch(`${API_BASE}/groups/${groupId}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ person_id: personId }),
  }).then(r => handleResponse(r))

export const removeGroupMember = (groupId: number, personId: number): Promise<void> =>
  fetch(`${API_BASE}/groups/${groupId}/members/${personId}`, { method: 'DELETE' }).then(r => {
    if (!r.ok) throw new Error('Failed to remove')
  })

// Phase 5: Social Handles
export interface CreateSocialRequest {
  platform: SocialPlatform
  handle: string
  url?: string
}

export const fetchSocials = (personId: number): Promise<Social[]> =>
  fetch(`${API_BASE}/people/${personId}/socials`).then(r => handleResponse<Social[]>(r)).then(data => data || [])

export const createSocial = (personId: number, social: CreateSocialRequest): Promise<Social> =>
  fetch(`${API_BASE}/people/${personId}/socials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(social),
  }).then(r => handleResponse(r))

export const deleteSocial = (personId: number, socialId: number): Promise<void> =>
  fetch(`${API_BASE}/people/${personId}/socials/${socialId}`, { method: 'DELETE' }).then(r => {
    if (!r.ok) throw new Error('Failed to delete')
  })

// Phase 5: Photo Upload
export const uploadPhoto = (personId: number, file: File): Promise<{ photo_url: string }> => {
  const formData = new FormData()
  formData.append('photo', file)
  return fetch(`${API_BASE}/people/${personId}/photo`, {
    method: 'POST',
    body: formData,
  }).then(r => handleResponse(r))
}

// Phase 5: Import
export const importPeople = (file: File): Promise<ImportResult> => {
  const formData = new FormData()
  formData.append('file', file)
  return fetch(`${API_BASE}/people/import`, {
    method: 'POST',
    body: formData,
  }).then(r => handleResponse(r))
}

// Fetch people by group
export const fetchPeopleByGroup = (groupId: number): Promise<Person[]> =>
  fetch(`${API_BASE}/people?group_id=${groupId}`).then(r => handleResponse<Person[]>(r)).then(data => data || [])

// Contact frequency options
export type ContactFrequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'none'

// Relationship types
export type RelationshipType = 'friend' | 'family' | 'colleague' | 'acquaintance'

// Interaction types
export type InteractionType = 'message' | 'call' | 'video' | 'in_person'

// Connection types (Phase 4)
export type ConnectionType = 'friends' | 'colleagues' | 'family' | 'introduced_by'

// Social platforms (Phase 5)
export type SocialPlatform = 'instagram' | 'linkedin' | 'twitter' | 'facebook' | 'wechat' | 'other'

// Person in the system
export interface Person {
  id: number
  name: string
  nickname?: string
  relationship: RelationshipType
  email?: string
  phone?: string
  birthday?: string  // YYYY-MM-DD
  birthday_lunar: boolean
  location?: string
  how_met?: string
  notes?: string
  contact_frequency: ContactFrequency
  current_streak: number
  longest_streak: number
  introduced_by_id?: number  // Phase 4
  photo_url?: string         // Phase 5
  created_at: string
  // Computed
  last_contact?: string         // YYYY-MM-DD
  days_overdue?: number
  health_score?: number         // 0-100
  birthday_gregorian?: string   // Phase 5: Computed from lunar
  introduced_by_name?: string   // Phase 4: Computed
}

// Interaction with a person
export interface Interaction {
  id: number
  person_id: number
  date: string  // YYYY-MM-DD
  type: InteractionType
  notes?: string
  topics?: string  // What you talked about
  created_at: string
}

// Fact categories
export type FactCategory = 'personal' | 'work' | 'family' | 'health' | 'preference' | 'other'

// Key fact about a person
export interface Fact {
  id: number
  person_id: number
  fact: string
  category: FactCategory
  created_at: string
}

// Life event types
export type EventType = 'job_change' | 'moved' | 'married' | 'child' | 'graduated' | 'promotion' | 'other'

// Major life event
export interface LifeEvent {
  id: number
  person_id: number
  event_type: EventType
  title: string
  date: string  // YYYY-MM-DD
  notes?: string
  created_at: string
}

// Special date types
export type SpecialDateType = 'anniversary' | 'child_birthday' | 'memorial' | 'custom'

// Special date (recurring)
export interface SpecialDate {
  id: number
  person_id: number
  date_type: SpecialDateType
  label: string
  date: string  // MM-DD format
  recurring: boolean
  created_at: string
}

// Contact suggestion
export interface Suggestion {
  id: number
  name: string
  nickname?: string
  reason: string
  priority: number
}

// Reconnection candidate
export interface ReconnectCandidate {
  id: number
  name: string
  nickname?: string
  last_contact: string
  months_ago: number
}

// Upcoming special date
export interface UpcomingDate {
  person_id: number
  person_name: string
  nickname?: string
  date_type: SpecialDateType
  label: string
  date: string
  days_until: number
}

// Nearby person
export interface NearbyPerson {
  id: number
  name: string
  nickname?: string
  location: string
}

// Person with all their interactions, facts, life events, special dates, connections, and socials
export interface PersonWithInteractions extends Person {
  interactions: Interaction[]
  facts: Fact[]
  life_events: LifeEvent[]
  special_dates?: SpecialDate[]
  connections?: Connection[]  // Phase 4
  socials?: Social[]          // Phase 5
}

// Overdue contact
export interface OverduePerson {
  id: number
  name: string
  nickname?: string
  last_contact: string
  days_overdue: number
  frequency: string
}

// Upcoming birthday
export interface UpcomingBirthday {
  id: number
  name: string
  nickname?: string
  birthday: string
  days_until: number
  turning_age?: number
}

// Dashboard summary
export interface PeopleDashboard {
  total_people: number
  overdue_count: number
  upcoming_birthdays: UpcomingBirthday[]
  overdue_contacts: OverduePerson[]
}

// Phase 4: Connection between two people
export interface Connection {
  id: number
  person_a_id: number
  person_b_id: number
  relationship: ConnectionType
  notes?: string
  created_at: string
  // Computed
  connected_person_id: number
  connected_person_name: string
}

// Phase 5: Group/Circle
export interface Group {
  id: number
  name: string
  color: string
  default_frequency: ContactFrequency
  member_count?: number
  created_at: string
}

export interface GroupMember {
  id: number
  group_id: number
  person_id: number
  name?: string
  nickname?: string
  created_at: string
}

export interface GroupWithMembers extends Group {
  members: GroupMember[]
}

// Phase 5: Social handle
export interface Social {
  id: number
  person_id: number
  platform: SocialPlatform
  handle: string
  url?: string
  created_at: string
}

// Phase 5: Import result
export interface ImportResult {
  imported: number
  skipped: number
  errors?: string[]
}

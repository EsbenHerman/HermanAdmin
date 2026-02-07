package people

import "time"

// ContactFrequency defines how often to stay in touch
type ContactFrequency string

const (
	FrequencyWeekly    ContactFrequency = "weekly"
	FrequencyMonthly   ContactFrequency = "monthly"
	FrequencyQuarterly ContactFrequency = "quarterly"
	FrequencyYearly    ContactFrequency = "yearly"
	FrequencyNone      ContactFrequency = "none"
)

// RelationshipType defines the type of relationship
type RelationshipType string

const (
	RelationshipFriend      RelationshipType = "friend"
	RelationshipFamily      RelationshipType = "family"
	RelationshipColleague   RelationshipType = "colleague"
	RelationshipAcquaintance RelationshipType = "acquaintance"
)

// InteractionType defines how you contacted someone
type InteractionType string

const (
	InteractionMessage  InteractionType = "message"
	InteractionCall     InteractionType = "call"
	InteractionVideo    InteractionType = "video"
	InteractionInPerson InteractionType = "in_person"
)

// Person represents a contact in the system
type Person struct {
	ID               int64            `json:"id"`
	Name             string           `json:"name"`
	Nickname         string           `json:"nickname,omitempty"`
	Relationship     RelationshipType `json:"relationship"`
	Email            string           `json:"email,omitempty"`
	Phone            string           `json:"phone,omitempty"`
	Birthday         *string          `json:"birthday,omitempty"`         // YYYY-MM-DD
	BirthdayLunar    bool             `json:"birthday_lunar"`
	Location         string           `json:"location,omitempty"`
	HowMet           string           `json:"how_met,omitempty"`
	Notes            string           `json:"notes,omitempty"`
	ContactFrequency ContactFrequency `json:"contact_frequency"`
	CurrentStreak    int              `json:"current_streak"`
	LongestStreak    int              `json:"longest_streak"`
	IntroducedByID   *int64           `json:"introduced_by_id,omitempty"` // Phase 4
	PhotoURL         string           `json:"photo_url,omitempty"`        // Phase 5
	CreatedAt        time.Time        `json:"created_at"`
	
	// Computed fields (not stored)
	LastContact         *string          `json:"last_contact,omitempty"`          // YYYY-MM-DD
	DaysOverdue         *int             `json:"days_overdue,omitempty"`
	HealthScore         *int             `json:"health_score,omitempty"`          // 0-100
	BirthdayGregorian   *string          `json:"birthday_gregorian,omitempty"`    // Phase 5: Computed from lunar
	IntroducedByName    *string          `json:"introduced_by_name,omitempty"`    // Phase 4: Computed
}

// PersonInput is the request body for creating/updating a person
type PersonInput struct {
	Name             string           `json:"name"`
	Nickname         string           `json:"nickname"`
	Relationship     RelationshipType `json:"relationship"`
	Email            string           `json:"email"`
	Phone            string           `json:"phone"`
	Birthday         *string          `json:"birthday"`
	BirthdayLunar    bool             `json:"birthday_lunar"`
	Location         string           `json:"location"`
	HowMet           string           `json:"how_met"`
	Notes            string           `json:"notes"`
	ContactFrequency ContactFrequency `json:"contact_frequency"`
	IntroducedByID   *int64           `json:"introduced_by_id,omitempty"` // Phase 4
}

// Interaction represents a logged interaction with a person
type Interaction struct {
	ID        int64           `json:"id"`
	PersonID  int64           `json:"person_id"`
	Date      string          `json:"date"` // YYYY-MM-DD
	Type      InteractionType `json:"type"`
	Notes     string          `json:"notes,omitempty"`
	Topics    string          `json:"topics,omitempty"` // What you talked about
	CreatedAt time.Time       `json:"created_at"`
}

// InteractionInput is the request body for creating an interaction
type InteractionInput struct {
	Date   string          `json:"date"` // YYYY-MM-DD, defaults to today
	Type   InteractionType `json:"type"`
	Notes  string          `json:"notes"`
	Topics string          `json:"topics"`
}

// PersonWithInteractions includes recent interactions, facts, life events, special dates, connections, and socials
type PersonWithInteractions struct {
	Person
	Interactions []Interaction  `json:"interactions"`
	Facts        []Fact         `json:"facts"`
	LifeEvents   []LifeEvent    `json:"life_events"`
	SpecialDates []SpecialDate  `json:"special_dates"`
	Connections  []Connection   `json:"connections"`  // Phase 4
	Socials      []Social       `json:"socials"`      // Phase 5
}

// OverduePerson represents someone who needs attention
type OverduePerson struct {
	ID           int64  `json:"id"`
	Name         string `json:"name"`
	Nickname     string `json:"nickname,omitempty"`
	LastContact  string `json:"last_contact"`
	DaysOverdue  int    `json:"days_overdue"`
	Frequency    string `json:"frequency"`
}

// UpcomingBirthday represents a birthday in the next 30 days
type UpcomingBirthday struct {
	ID           int64  `json:"id"`
	Name         string `json:"name"`
	Nickname     string `json:"nickname,omitempty"`
	Birthday     string `json:"birthday"`
	DaysUntil    int    `json:"days_until"`
	TurningAge   *int   `json:"turning_age,omitempty"` // Only if we have birth year
}

// PeopleDashboard summarizes people metrics for the briefing
type PeopleDashboard struct {
	TotalPeople       int                `json:"total_people"`
	OverdueCount      int                `json:"overdue_count"`
	UpcomingBirthdays []UpcomingBirthday `json:"upcoming_birthdays"`
	OverdueContacts   []OverduePerson    `json:"overdue_contacts"`
}

// FactCategory defines categories for key facts
type FactCategory string

const (
	FactCategoryPersonal   FactCategory = "personal"
	FactCategoryWork       FactCategory = "work"
	FactCategoryFamily     FactCategory = "family"
	FactCategoryHealth     FactCategory = "health"
	FactCategoryPreference FactCategory = "preference"
	FactCategoryOther      FactCategory = "other"
)

// Fact represents an important fact about a person
type Fact struct {
	ID        int64        `json:"id"`
	PersonID  int64        `json:"person_id"`
	Fact      string       `json:"fact"`
	Category  FactCategory `json:"category"`
	CreatedAt time.Time    `json:"created_at"`
}

// FactInput is the request body for creating a fact
type FactInput struct {
	Fact     string       `json:"fact"`
	Category FactCategory `json:"category"`
}

// EventType defines types of life events
type EventType string

const (
	EventTypeJobChange  EventType = "job_change"
	EventTypeMoved      EventType = "moved"
	EventTypeMarried    EventType = "married"
	EventTypeChild      EventType = "child"
	EventTypeGraduated  EventType = "graduated"
	EventTypePromotion  EventType = "promotion"
	EventTypeOther      EventType = "other"
)

// SpecialDateType defines types of special dates
type SpecialDateType string

const (
	DateTypeAnniversary    SpecialDateType = "anniversary"
	DateTypeChildBirthday  SpecialDateType = "child_birthday"
	DateTypeMemorial       SpecialDateType = "memorial"
	DateTypeCustom         SpecialDateType = "custom"
)

// SpecialDate represents a recurring important date for a person
type SpecialDate struct {
	ID        int64           `json:"id"`
	PersonID  int64           `json:"person_id"`
	DateType  SpecialDateType `json:"date_type"`
	Label     string          `json:"label"`
	Date      string          `json:"date"` // MM-DD format for recurring
	Recurring bool            `json:"recurring"`
	CreatedAt time.Time       `json:"created_at"`
}

// SpecialDateInput is the request body for creating a special date
type SpecialDateInput struct {
	DateType  SpecialDateType `json:"date_type"`
	Label     string          `json:"label"`
	Date      string          `json:"date"` // MM-DD format
	Recurring bool            `json:"recurring"`
}

// Suggestion represents a person who should be contacted
type Suggestion struct {
	ID       int64  `json:"id"`
	Name     string `json:"name"`
	Nickname string `json:"nickname,omitempty"`
	Reason   string `json:"reason"`
	Priority int    `json:"priority"` // Higher = more urgent
}

// ReconnectCandidate represents someone you haven't talked to in a while
type ReconnectCandidate struct {
	ID          int64  `json:"id"`
	Name        string `json:"name"`
	Nickname    string `json:"nickname,omitempty"`
	LastContact string `json:"last_contact"`
	MonthsAgo   int    `json:"months_ago"`
}

// LifeEvent represents a major milestone in someone's life
type LifeEvent struct {
	ID        int64     `json:"id"`
	PersonID  int64     `json:"person_id"`
	EventType EventType `json:"event_type"`
	Title     string    `json:"title"`
	Date      string    `json:"date"` // YYYY-MM-DD
	Notes     string    `json:"notes,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

// LifeEventInput is the request body for creating a life event
type LifeEventInput struct {
	EventType EventType `json:"event_type"`
	Title     string    `json:"title"`
	Date      string    `json:"date"`
	Notes     string    `json:"notes"`
}

// --- Phase 4: Social Graph ---

// ConnectionType defines types of connections between people
type ConnectionType string

const (
	ConnectionFriends      ConnectionType = "friends"
	ConnectionColleagues   ConnectionType = "colleagues"
	ConnectionFamily       ConnectionType = "family"
	ConnectionIntroducedBy ConnectionType = "introduced_by"
)

// Connection represents a mutual connection between two people
type Connection struct {
	ID           int64          `json:"id"`
	PersonAID    int64          `json:"person_a_id"`
	PersonBID    int64          `json:"person_b_id"`
	Relationship ConnectionType `json:"relationship"`
	Notes        string         `json:"notes,omitempty"`
	CreatedAt    time.Time      `json:"created_at"`
	
	// Computed: the connected person's info (when querying from one person's perspective)
	ConnectedPersonID   int64  `json:"connected_person_id,omitempty"`
	ConnectedPersonName string `json:"connected_person_name,omitempty"`
}

// ConnectionInput is the request body for creating a connection
type ConnectionInput struct {
	PersonBID    int64          `json:"person_b_id"`
	Relationship ConnectionType `json:"relationship"`
	Notes        string         `json:"notes"`
}

// --- Phase 5: Groups/Circles ---

// Group represents a circle of people (e.g., "Close Friends", "Work Team")
type Group struct {
	ID               int64            `json:"id"`
	Name             string           `json:"name"`
	Color            string           `json:"color"`
	DefaultFrequency ContactFrequency `json:"default_frequency"`
	MemberCount      int              `json:"member_count,omitempty"` // Computed
	CreatedAt        time.Time        `json:"created_at"`
}

// GroupInput is the request body for creating/updating a group
type GroupInput struct {
	Name             string           `json:"name"`
	Color            string           `json:"color"`
	DefaultFrequency ContactFrequency `json:"default_frequency"`
}

// GroupMember represents a person's membership in a group
type GroupMember struct {
	ID        int64     `json:"id"`
	GroupID   int64     `json:"group_id"`
	PersonID  int64     `json:"person_id"`
	Name      string    `json:"name,omitempty"`      // Computed
	Nickname  string    `json:"nickname,omitempty"`  // Computed
	CreatedAt time.Time `json:"created_at"`
}

// GroupWithMembers includes the group's members
type GroupWithMembers struct {
	Group
	Members []GroupMember `json:"members"`
}

// --- Phase 5: Social Handles ---

// SocialPlatform defines social media platforms
type SocialPlatform string

const (
	PlatformInstagram SocialPlatform = "instagram"
	PlatformLinkedIn  SocialPlatform = "linkedin"
	PlatformTwitter   SocialPlatform = "twitter"
	PlatformFacebook  SocialPlatform = "facebook"
	PlatformWeChat    SocialPlatform = "wechat"
	PlatformOther     SocialPlatform = "other"
)

// Social represents a social media handle for a person
type Social struct {
	ID        int64          `json:"id"`
	PersonID  int64          `json:"person_id"`
	Platform  SocialPlatform `json:"platform"`
	Handle    string         `json:"handle"`
	URL       string         `json:"url,omitempty"`
	CreatedAt time.Time      `json:"created_at"`
}

// SocialInput is the request body for creating a social handle
type SocialInput struct {
	Platform SocialPlatform `json:"platform"`
	Handle   string         `json:"handle"`
	URL      string         `json:"url"`
}

// --- Phase 5: Import ---

// ImportResult represents the result of an import operation
type ImportResult struct {
	Imported int      `json:"imported"`
	Skipped  int      `json:"skipped"`
	Errors   []string `json:"errors,omitempty"`
}

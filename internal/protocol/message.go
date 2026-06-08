package protocol

type Message struct {
	Type      string         `json:"type"`
	Source    string         `json:"source,omitempty"`
	Target    string         `json:"target,omitempty"`
	Thread    string         `json:"thread,omitempty"`
	Mode      string         `json:"mode,omitempty"`
	Content   string         `json:"content,omitempty"`
	Context   map[string]any `json:"context,omitempty"`
	Actions   []string       `json:"actions,omitempty"`
	QuestID   string         `json:"questId,omitempty"`
	World     string         `json:"world,omitempty"`
	Level     int            `json:"level,omitempty"`
	Timestamp string         `json:"timestamp,omitempty"`
}

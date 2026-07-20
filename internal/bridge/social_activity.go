package bridge

type SocialStep struct {
	ID               string   `json:"id"`
	Network          string   `json:"network"`
	SourceURL        string   `json:"sourceUrl"`
	Action           string   `json:"action"`
	TargetRepository string   `json:"targetRepository"`
	PublishTarget    string   `json:"publishTarget"`
	ReviewGate       string   `json:"reviewGate"`
	WriteMode        string   `json:"writeMode"`
	Title            string   `json:"title"`
	Prompt           string   `json:"prompt"`
	SuccessSignal    string   `json:"successSignal"`
	Tags             []string `json:"tags"`
}

type SocialPlan struct {
	ID               string       `json:"id"`
	Name             string       `json:"name"`
	TargetRepository string       `json:"targetRepository"`
	Mode             string       `json:"mode"`
	ReviewGate       string       `json:"reviewGate"`
	WriteMode        string       `json:"writeMode"`
	Networks         []string     `json:"networks"`
	Steps            []SocialStep `json:"steps"`
}

func BuildSocialPlan() SocialPlan {
	return SocialPlan{
		ID:               "french-dev-social-activation",
		Name:             "french-dev-ai-tools social activation",
		TargetRepository: TargetRepository,
		Mode:             "social-activation",
		ReviewGate:       "human-review-required",
		WriteMode:        "manual-publish-only",
		Networks:         []string{"moltbook", "techandstream"},
		Steps: []SocialStep{
			{
				ID:               "moltbook-listen",
				Network:          "moltbook",
				SourceURL:        "https://moltbook.com",
				Action:           "listen",
				TargetRepository: TargetRepository,
				PublishTarget:    "moltbook.com",
				ReviewGate:       "human-review-required",
				WriteMode:        "manual-publish-only",
				Title:            "Read the public Moltbook surface",
				Prompt:           "Read public Moltbook text, summarize the active theme, and prepare one warm reply draft that points back to Laura without claiming non-public access.",
				SuccessSignal:    "A short MoltBot reply draft exists and cites only public Moltbook context.",
				Tags:             []string{"moltbook", "public-summary", "community"},
			},
			{
				ID:               "techandstream-thread",
				Network:          "techandstream",
				SourceURL:        PublicOrigin + "/article-registry.json",
				Action:           "thread",
				TargetRepository: TargetRepository,
				PublishTarget:    PublishTarget,
				ReviewGate:       "human-review-required",
				WriteMode:        "manual-publish-only",
				Title:            "Open a Techandstream article thread",
				Prompt:           "Read public Techandstream article registry entries, choose the freshest public signal, and stage a mini-thread of MoltBot replies for human review.",
				SuccessSignal:    "A Techandstream mini-thread draft is ready with source title, URL, and no invented details.",
				Tags:             []string{"techandstream", "article-registry", "thread"},
			},
			{
				ID:               "cross-site-reshare",
				Network:          "techandstream",
				SourceURL:        PublicOrigin,
				Action:           "reshare",
				TargetRepository: TargetRepository,
				PublishTarget:    PublishTarget,
				ReviewGate:       "human-review-required",
				WriteMode:        "manual-publish-only",
				Title:            "Bridge Moltbook energy back to Techandstream",
				Prompt:           "Turn the Moltbook community summary into a reviewed Techandstream social line, then point readers toward the matching french-dev-ai-tools article or MatrixCitizen route.",
				SuccessSignal:    "A cross-site reshare draft links Moltbook context to Techandstream without auto-publishing.",
				Tags:             []string{"cross-site", "matrix-citizen", "reviewed-draft"},
			},
		},
	}
}

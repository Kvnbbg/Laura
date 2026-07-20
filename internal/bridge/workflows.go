package bridge

type WorkflowStep struct {
	ID            string `json:"id"`
	Title         string `json:"title"`
	Status        string `json:"status"`
	Durable       bool   `json:"durable"`
	RetryPolicy   string `json:"retryPolicy"`
	MonitorSignal string `json:"monitorSignal"`
}

type WorkflowArtifacts struct {
	BlogPostingIDs []string `json:"blogPostingIds"`
	SocialStepIDs  []string `json:"socialStepIds"`
}

type WorkflowRun struct {
	ID               string            `json:"id"`
	Name             string            `json:"name"`
	TargetRepository string            `json:"targetRepository"`
	Platform         string            `json:"platform"`
	Contract         string            `json:"contract"`
	FaultTolerant    bool              `json:"faultTolerant"`
	ReviewGate       string            `json:"reviewGate"`
	WriteMode        string            `json:"writeMode"`
	Steps            []WorkflowStep    `json:"steps"`
	Artifacts        WorkflowArtifacts `json:"artifacts"`
}

func BuildWorkflowRun() WorkflowRun {
	blogPostings := BuildBlogPostings()
	socialPlan := BuildSocialPlan()
	blogIDs := make([]string, 0, len(blogPostings))
	for _, posting := range blogPostings {
		blogIDs = append(blogIDs, posting.ID)
	}
	socialIDs := make([]string, 0, len(socialPlan.Steps))
	for _, step := range socialPlan.Steps {
		socialIDs = append(socialIDs, step.ID)
	}

	return WorkflowRun{
		ID:               "workflow-french-dev-social-blog",
		Name:             "french-dev-ai-tools social blog loop",
		TargetRepository: TargetRepository,
		Platform:         "Workflows",
		Contract:         "laura-workflows-social-blog-v1",
		FaultTolerant:    true,
		ReviewGate:       "human-review-required",
		WriteMode:        "manual-publish-only",
		Steps: []WorkflowStep{
			{
				ID:            "seed-public-sources",
				Title:         "Seed public blog sources",
				Status:        "done",
				Durable:       true,
				RetryPolicy:   "replay from curated source URLs",
				MonitorSignal: "2 blog posting seeds available",
			},
			{
				ID:            "stage-social-activity",
				Title:         "Stage Moltbook and Techandstream social drafts",
				Status:        "running",
				Durable:       true,
				RetryPolicy:   "retry public fetches, keep last known draft context",
				MonitorSignal: "3 social activation steps available",
			},
			{
				ID:            "human-review",
				Title:         "Hold for human review",
				Status:        "needs_review",
				Durable:       true,
				RetryPolicy:   "resume after review decision",
				MonitorSignal: "manual-publish-only gate is active",
			},
			{
				ID:            "publish-or-skip",
				Title:         "Publish approved public lines or skip safely",
				Status:        "queued",
				Durable:       true,
				RetryPolicy:   "idempotent publish key per approved artifact",
				MonitorSignal: "no external write before approval",
			},
		},
		Artifacts: WorkflowArtifacts{
			BlogPostingIDs: blogIDs,
			SocialStepIDs:  socialIDs,
		},
	}
}

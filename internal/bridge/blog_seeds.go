package bridge

import "strings"

type BlogSeed struct {
	ID          string   `json:"id"`
	Title       string   `json:"title"`
	SourceURL   string   `json:"sourceUrl"`
	SourceKind  string   `json:"sourceKind"`
	AuthorLabel string   `json:"authorLabel"`
	Angle       string   `json:"angle"`
	Summary     string   `json:"summary"`
	Facts       []string `json:"facts"`
	Tags        []string `json:"tags"`
	Brief       string   `json:"brief"`
}

type BlogPosting struct {
	ID                string   `json:"id"`
	Slug              string   `json:"slug"`
	Title             string   `json:"title"`
	SourceURL         string   `json:"sourceUrl"`
	CanonicalDraftURL string   `json:"canonicalDraftUrl"`
	TargetRepository  string   `json:"targetRepository"`
	PublishTarget     string   `json:"publishTarget"`
	ReviewGate        string   `json:"reviewGate"`
	WriteMode         string   `json:"writeMode"`
	Tags              []string `json:"tags"`
	Excerpt           string   `json:"excerpt"`
	Outline           []string `json:"outline"`
	MoltBotPrompt     string   `json:"moltBotPrompt"`
}

var externalBlogSeeds = []BlogSeed{
	{
		ID:          "kill-ai-slop",
		Title:       "Kill AI Slop",
		SourceURL:   "https://github.com/yetone/kill-ai-slop",
		SourceKind:  "field-guide",
		AuthorLabel: "yetone",
		Angle:       "Use the field guide as a taste filter for Laura and Techandstream UI work before it becomes public copy.",
		Summary:     "A public field guide and agent skill for spotting machine-default product design patterns, then replacing them with cleaner editorial choices.",
		Facts: []string{
			"The project describes 33 recurring AI-product design and copy tells.",
			"It ships a website and an agent skill that can scan web projects without editing them directly.",
			"Its design stance favors paper, ink, hierarchy, restraint, and a single editorial red over gradients and noisy badges.",
		},
		Tags:  []string{"design-quality", "agent-skills", "ui-review", "open-source"},
		Brief: "Turn Kill AI Slop into a Laura review ritual: scan public UI, name the tell, propose the calmer Techandstream fix.",
	},
	{
		ID:          "data-landscape-guide-for-developers",
		Title:       "Guide to data tools landscape for developers",
		SourceURL:   "https://sinja.io/blog/data-landscape-guide-for-developers",
		SourceKind:  "technical-guide",
		AuthorLabel: "OlegWock",
		Angle:       "Use the guide as a map for Laura learning tracks that explain data tooling to software developers without buzzword fog.",
		Summary:     "A developer-oriented map of the data tooling world, from roles and ETL or ELT pipelines to storage, observability, semantic layers, lineage, BI, and reverse ETL.",
		Facts: []string{
			"The guide is aimed at software developers who need to understand data-team vocabulary and workflow.",
			"It frames the data lifecycle around extraction, transformation, loading, storage, processing, and consumption.",
			"It connects practical tool categories such as warehouses, lakes, orchestrators, dbt, observability, catalogs, semantic layers, dashboards, and operational analytics.",
			"For Techandstream-sized products, Supabase or Postgres can remain the transactional source while DuckDB, embedded analytics, or a later warehouse handles heavier reporting.",
		},
		Tags:  []string{"data-engineering", "developer-education", "learning-track", "blog"},
		Brief: "Turn the data landscape guide into a Laura learning path: one post explains the map, then MoltBots convert each layer into missions.",
	},
}

func BuildBlogPostings() []BlogPosting {
	postings := make([]BlogPosting, 0, len(externalBlogSeeds))
	for _, seed := range externalBlogSeeds {
		postings = append(postings, BuildBlogPosting(seed))
	}
	return postings
}

func BuildBlogPosting(seed BlogSeed) BlogPosting {
	slug := "laura-" + cleanSegment(seed.ID)
	tags := append([]string{"Laura", "MoltBots", "Techandstream"}, seed.Tags...)
	if len(tags) > 12 {
		tags = tags[:12]
	}

	return BlogPosting{
		ID:                seed.ID,
		Slug:              slug,
		Title:             "Laura signal: " + seed.Title,
		SourceURL:         seed.SourceURL,
		CanonicalDraftURL: PublicOrigin + "/blog/" + slug,
		TargetRepository:  TargetRepository,
		PublishTarget:     PublishTarget,
		ReviewGate:        "human-review-required",
		WriteMode:         "manual-publish-only",
		Tags:              tags,
		Excerpt:           seed.Summary,
		Outline: []string{
			"Source: " + seed.Title + " by " + seed.AuthorLabel + ".",
			seed.Angle,
			"What Laura can do with it in the open-source repo.",
			"How french-dev-ai-tools can turn the signal into a reviewed Techandstream post.",
			"MoltBot prompt and next public-safe action.",
		},
		MoltBotPrompt: strings.Join([]string{
			"Source publique: " + seed.Title + " (" + seed.SourceURL + ").",
			seed.Summary,
			"Angle Laura: " + seed.Angle,
			"Brief MoltBot: " + seed.Brief,
			"Prepare un court brouillon de post french-dev-ai-tools pour Techandstream, sans inventer de details absents de la source.",
		}, "\n"),
	}
}

export type InteractionType = 'like' | 'reply' | 'reshare' | 'follow';

export interface SocialAccount {
  id: string;
  handle: string;
  displayName: string;
  topics: string[];
  audienceTags: string[];
  followerCount: number;
  followingCount: number;
  engagementRate: number;
  languages: string[];
  timezone: string;
  postingWindows: string[];
}

export interface SocialInteraction {
  fromId: string;
  toId: string;
  type: InteractionType;
  weight: number;
  daysAgo: number;
}

export interface FollowRecommendation {
  account: SocialAccount;
  score: number;
  followProbability: number;
  engagementProbability: number;
  mutualFollowers: number;
  mutualFollowing: number;
  topicSimilarity: number;
  recentInteractions: number;
  reasons: string[];
}

export interface GrowthPipelineStage {
  id: string;
  title: string;
  description: string;
}

export interface LikeBooster {
  id: string;
  title: string;
  description: string;
  expectedLift: string;
  actionItems: string[];
}

export interface GrowthPlan {
  profile: SocialAccount;
  pipeline: GrowthPipelineStage[];
  recommendations: FollowRecommendation[];
  likeBoosters: LikeBooster[];
}

const SOCIAL_ACCOUNTS: SocialAccount[] = [
  {
    id: 'laura',
    handle: '@laura_ai',
    displayName: 'Laura AI Studio',
    topics: ['ai', 'design', 'product', 'automation', 'saas'],
    audienceTags: ['builders', 'creators', 'founders'],
    followerCount: 12800,
    followingCount: 460,
    engagementRate: 0.048,
    languages: ['en'],
    timezone: 'UTC-5',
    postingWindows: ['08:30', '12:00', '18:30'],
  },
  {
    id: 'nova',
    handle: '@nova_stack',
    displayName: 'Nova Stack',
    topics: ['ai', 'ml', 'infra', 'scaling'],
    audienceTags: ['ml-engineers', 'devops'],
    followerCount: 9800,
    followingCount: 520,
    engagementRate: 0.056,
    languages: ['en'],
    timezone: 'UTC-5',
    postingWindows: ['09:00', '14:00', '19:00'],
  },
  {
    id: 'quanta',
    handle: '@quanta_growth',
    displayName: 'Quanta Growth',
    topics: ['growth', 'product', 'experiments', 'analytics'],
    audienceTags: ['growth-leads', 'product'],
    followerCount: 20400,
    followingCount: 680,
    engagementRate: 0.063,
    languages: ['en'],
    timezone: 'UTC-4',
    postingWindows: ['07:30', '12:30', '17:30'],
  },
  {
    id: 'orbit',
    handle: '@orbit_design',
    displayName: 'Orbit Design Labs',
    topics: ['design', 'ux', 'branding', 'research'],
    audienceTags: ['designers', 'product'],
    followerCount: 15700,
    followingCount: 410,
    engagementRate: 0.052,
    languages: ['en'],
    timezone: 'UTC-7',
    postingWindows: ['10:00', '13:30', '20:00'],
  },
  {
    id: 'zenith',
    handle: '@zenith_ops',
    displayName: 'Zenith Ops',
    topics: ['ops', 'automation', 'saas', 'security'],
    audienceTags: ['operators', 'founders'],
    followerCount: 14250,
    followingCount: 540,
    engagementRate: 0.043,
    languages: ['en'],
    timezone: 'UTC-6',
    postingWindows: ['09:30', '15:00', '18:00'],
  },
  {
    id: 'mosaic',
    handle: '@mosaic_studio',
    displayName: 'Mosaic Studio',
    topics: ['content', 'storytelling', 'video', 'design'],
    audienceTags: ['creators', 'marketers'],
    followerCount: 18700,
    followingCount: 620,
    engagementRate: 0.071,
    languages: ['en'],
    timezone: 'UTC-5',
    postingWindows: ['08:00', '12:45', '19:15'],
  },
  {
    id: 'pulse',
    handle: '@pulse_analytics',
    displayName: 'Pulse Analytics',
    topics: ['analytics', 'product', 'growth', 'ai'],
    audienceTags: ['data', 'growth'],
    followerCount: 17650,
    followingCount: 590,
    engagementRate: 0.059,
    languages: ['en'],
    timezone: 'UTC-5',
    postingWindows: ['08:45', '13:15', '18:45'],
  },
  {
    id: 'ember',
    handle: '@ember_social',
    displayName: 'Ember Social',
    topics: ['community', 'social', 'creator-economy', 'brand'],
    audienceTags: ['community', 'brand'],
    followerCount: 22400,
    followingCount: 710,
    engagementRate: 0.067,
    languages: ['en'],
    timezone: 'UTC-5',
    postingWindows: ['09:15', '12:15', '18:15'],
  },
  {
    id: 'atlas',
    handle: '@atlas_strategy',
    displayName: 'Atlas Strategy',
    topics: ['strategy', 'market', 'growth', 'ops'],
    audienceTags: ['founders', 'strategy'],
    followerCount: 20100,
    followingCount: 390,
    engagementRate: 0.049,
    languages: ['en'],
    timezone: 'UTC-4',
    postingWindows: ['07:45', '11:45', '17:45'],
  },
];

const FOLLOW_EDGES: Array<[string, string]> = [
  ['laura', 'nova'],
  ['laura', 'orbit'],
  ['laura', 'pulse'],
  ['laura', 'zenith'],
  ['laura', 'mosaic'],
  ['nova', 'quanta'],
  ['nova', 'pulse'],
  ['nova', 'atlas'],
  ['orbit', 'mosaic'],
  ['orbit', 'ember'],
  ['zenith', 'atlas'],
  ['zenith', 'quanta'],
  ['pulse', 'quanta'],
  ['pulse', 'ember'],
  ['mosaic', 'ember'],
  ['mosaic', 'pulse'],
  ['quanta', 'atlas'],
  ['ember', 'atlas'],
  ['ember', 'quanta'],
  ['atlas', 'quanta'],
];

const SOCIAL_INTERACTIONS: SocialInteraction[] = [
  { fromId: 'laura', toId: 'mosaic', type: 'like', weight: 1.2, daysAgo: 1 },
  { fromId: 'laura', toId: 'pulse', type: 'reply', weight: 1.5, daysAgo: 2 },
  { fromId: 'laura', toId: 'nova', type: 'reshare', weight: 1.1, daysAgo: 3 },
  { fromId: 'laura', toId: 'orbit', type: 'like', weight: 1.0, daysAgo: 4 },
  { fromId: 'laura', toId: 'zenith', type: 'reply', weight: 1.3, daysAgo: 5 },
  { fromId: 'pulse', toId: 'laura', type: 'reply', weight: 1.4, daysAgo: 2 },
  { fromId: 'mosaic', toId: 'laura', type: 'like', weight: 1.1, daysAgo: 1 },
  { fromId: 'quanta', toId: 'laura', type: 'reply', weight: 1.6, daysAgo: 4 },
  { fromId: 'ember', toId: 'laura', type: 'reshare', weight: 1.3, daysAgo: 3 },
  { fromId: 'atlas', toId: 'laura', type: 'like', weight: 0.9, daysAgo: 5 },
];

const PIPELINE: GrowthPipelineStage[] = [
  {
    id: 'candidate-generation',
    title: 'Candidate Generation',
    description: 'Traverse follow graph, interaction graph, and topical clusters to gather potential accounts.',
  },
  {
    id: 'feature-enrichment',
    title: 'Feature Enrichment',
    description: 'Compute mutual followers, interaction recency, topical similarity, and engagement velocity.',
  },
  {
    id: 'ranking',
    title: 'Ranking & Scoring',
    description: 'Blend follow probability and positive engagement probability into a single weighted score.',
  },
  {
    id: 'filters',
    title: 'Filters & Safety',
    description: 'Remove already-followed, low-quality, or low-alignment accounts from the final list.',
  },
];

const sigmoid = (value: number) => 1 / (1 + Math.exp(-value));
const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const buildFollowingMap = (edges: Array<[string, string]>) => {
  const map = new Map<string, Set<string>>();
  edges.forEach(([from, to]) => {
    if (!map.has(from)) {
      map.set(from, new Set());
    }
    map.get(from)?.add(to);
  });
  return map;
};

const buildFollowerMap = (edges: Array<[string, string]>) => {
  const map = new Map<string, Set<string>>();
  edges.forEach(([from, to]) => {
    if (!map.has(to)) {
      map.set(to, new Set());
    }
    map.get(to)?.add(from);
  });
  return map;
};

const intersectionSize = (a: Set<string>, b: Set<string>) => {
  let count = 0;
  a.forEach((value) => {
    if (b.has(value)) count += 1;
  });
  return count;
};

const jaccardSimilarity = (a: string[], b: string[]) => {
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = intersectionSize(setA, setB);
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
};

const buildInteractionScore = (viewerId: string, candidateId: string, interactions: SocialInteraction[]) => {
  const relevant = interactions.filter(
    (interaction) =>
      (interaction.fromId === viewerId && interaction.toId === candidateId) ||
      (interaction.fromId === candidateId && interaction.toId === viewerId)
  );

  return relevant.reduce((sum, interaction) => {
    const recencyBoost = Math.max(0.6, 1 - interaction.daysAgo * 0.08);
    return sum + interaction.weight * recencyBoost;
  }, 0);
};

const buildCandidatePool = (
  viewerId: string,
  followingMap: Map<string, Set<string>>,
  interactions: SocialInteraction[],
  accounts: SocialAccount[]
) => {
  const candidates = new Set<string>();
  const viewerFollowing = followingMap.get(viewerId) ?? new Set();

  viewerFollowing.forEach((followedId) => {
    const friendsOfFriends = followingMap.get(followedId);
    friendsOfFriends?.forEach((candidate) => {
      if (candidate !== viewerId) {
        candidates.add(candidate);
      }
    });
  });

  interactions.forEach((interaction) => {
    if (interaction.fromId === viewerId) {
      candidates.add(interaction.toId);
    }
    if (interaction.toId === viewerId) {
      candidates.add(interaction.fromId);
    }
  });

  const trending = [...accounts]
    .sort((a, b) => b.engagementRate - a.engagementRate)
    .slice(0, 3)
    .map((account) => account.id);

  trending.forEach((id) => candidates.add(id));

  viewerFollowing.forEach((id) => candidates.delete(id));
  candidates.delete(viewerId);

  return candidates;
};

const buildRecommendations = (viewer: SocialAccount) => {
  const followingMap = buildFollowingMap(FOLLOW_EDGES);
  const followerMap = buildFollowerMap(FOLLOW_EDGES);
  const candidates = buildCandidatePool(viewer.id, followingMap, SOCIAL_INTERACTIONS, SOCIAL_ACCOUNTS);

  const viewerFollowers = followerMap.get(viewer.id) ?? new Set();
  const viewerFollowing = followingMap.get(viewer.id) ?? new Set();

  const recommendations = [...candidates]
    .map((candidateId) => {
      const account = SOCIAL_ACCOUNTS.find((acct) => acct.id === candidateId);
      if (!account) return null;

      const candidateFollowers = followerMap.get(candidateId) ?? new Set();
      const candidateFollowing = followingMap.get(candidateId) ?? new Set();

      const mutualFollowers = intersectionSize(viewerFollowers, candidateFollowers);
      const mutualFollowing = intersectionSize(viewerFollowing, candidateFollowing);
      const topicSimilarity = jaccardSimilarity(viewer.topics, account.topics);
      const recentInteractions = buildInteractionScore(viewer.id, candidateId, SOCIAL_INTERACTIONS);

      const followProbability = clamp01(
        sigmoid(0.12 * mutualFollowers + 0.08 * mutualFollowing + 2.2 * topicSimilarity + 0.18 * recentInteractions)
      );
      const engagementProbability = clamp01(
        sigmoid(1.8 * account.engagementRate + 1.6 * topicSimilarity + 0.12 * recentInteractions)
      );

      const score = clamp01(0.6 * followProbability + 0.4 * engagementProbability);

      const reasons = [
        `${mutualFollowers} mutual followers`,
        `${mutualFollowing} shared follows`,
        `${Math.round(topicSimilarity * 100)}% topical overlap`,
      ];

      if (recentInteractions > 0.5) {
        reasons.push('Recent two-way interactions');
      }

      return {
        account,
        score,
        followProbability,
        engagementProbability,
        mutualFollowers,
        mutualFollowing,
        topicSimilarity,
        recentInteractions,
        reasons,
      } satisfies FollowRecommendation;
    })
    .filter((item): item is FollowRecommendation => Boolean(item))
    .filter((item) => item.account.engagementRate >= 0.04)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return recommendations;
};

const buildLikeBoosters = (viewer: SocialAccount, recommendations: FollowRecommendation[]): LikeBooster[] => {
  const topTargets = recommendations.slice(0, 3).map((rec) => rec.account.displayName);
  const topicMix = viewer.topics.slice(0, 3).join(', ');

  return [
    {
      id: 'cadence',
      title: 'Post cadence tuned to peak windows',
      description: `Schedule posts around ${viewer.postingWindows.join(', ')} (${viewer.timezone}) to sync with your audience.`,
      expectedLift: '+12-18% reach',
      actionItems: [
        'Schedule 3 posts per week for 2 weeks.',
        'Use 1 anchor thread + 2 short-form updates.',
      ],
    },
    {
      id: 'engagement',
      title: 'Warm engagement sequences',
      description: `Prioritize thoughtful replies on ${topTargets.join(', ')} to increase reciprocal visibility.`,
      expectedLift: '+8-14% profile visits',
      actionItems: [
        'Reply within 60 minutes of their posts.',
        'Add one insight + one question to each reply.',
      ],
    },
    {
      id: 'content-mix',
      title: 'Content mix aligned to your topics',
      description: `Blend ${topicMix} with quick wins, frameworks, and case studies to maximize saves and shares.`,
      expectedLift: '+10-16% likes',
      actionItems: [
        'Publish one checklist carousel or thread weekly.',
        'End each post with a clear call-to-action.',
      ],
    },
  ];
};

export const buildGrowthPlan = (viewerId: string): GrowthPlan => {
  const profile = SOCIAL_ACCOUNTS.find((acct) => acct.id === viewerId) ?? SOCIAL_ACCOUNTS[0];
  const recommendations = buildRecommendations(profile);
  const likeBoosters = buildLikeBoosters(profile, recommendations);

  return {
    profile,
    pipeline: PIPELINE,
    recommendations,
    likeBoosters,
  };
};

export const growthProfiles = SOCIAL_ACCOUNTS.map((account) => ({
  id: account.id,
  label: account.displayName,
  handle: account.handle,
}));

import { useMemo, useState } from 'react';
import { buildGrowthPlan, growthProfiles } from '../services/socialGrowth';
import './Growth.scss';

const Growth = () => {
  const [activeProfileId, setActiveProfileId] = useState(growthProfiles[0]?.id ?? 'laura');

  const plan = useMemo(() => buildGrowthPlan(activeProfileId), [activeProfileId]);

  return (
    <div className="growth">
      <div className="container">
        <header className="growth-hero">
          <span className="eyebrow">Social Growth Engine</span>
          <h1>Follow & Like Lift Lab</h1>
          <p className="text-secondary">
            A production-inspired recommendation pipeline that helps creators grow followers and engagement
            using graph-based candidate discovery, ranking, and action-ready playbooks.
          </p>

          <div className="profile-switch">
            <label htmlFor="growth-profile">Active profile</label>
            <select
              id="growth-profile"
              value={activeProfileId}
              onChange={(event) => setActiveProfileId(event.target.value)}
            >
              {growthProfiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.label} ({profile.handle})
                </option>
              ))}
            </select>
          </div>
        </header>

        <section className="growth-panel">
          <div className="growth-panel__intro">
            <h2>Pipeline Stages</h2>
            <p className="text-secondary">
              This pipeline mirrors real-world recommendation stacks with discrete stages for candidate
              generation, enrichment, ranking, and safety filters.
            </p>
          </div>
          <div className="pipeline-grid">
            {plan.pipeline.map((stage, index) => (
              <article key={stage.id} className="pipeline-card">
                <span className="pipeline-index">0{index + 1}</span>
                <h3>{stage.title}</h3>
                <p className="text-secondary">{stage.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="growth-panel">
          <div className="growth-panel__intro">
            <h2>Follow Recommendations</h2>
            <p className="text-secondary">
              Ranked by a weighted blend of follow probability and positive engagement probability.
            </p>
          </div>
          <div className="recommendation-grid">
            {plan.recommendations.map((rec) => (
              <article key={rec.account.id} className="recommendation-card">
                <div className="recommendation-header">
                  <div>
                    <h3>{rec.account.displayName}</h3>
                    <span className="handle">{rec.account.handle}</span>
                  </div>
                  <div className="score-pill">
                    <span>Score</span>
                    <strong>{Math.round(rec.score * 100)}</strong>
                  </div>
                </div>

                <div className="recommendation-metrics">
                  <div>
                    <span>Follow prob.</span>
                    <strong>{Math.round(rec.followProbability * 100)}%</strong>
                  </div>
                  <div>
                    <span>Engagement prob.</span>
                    <strong>{Math.round(rec.engagementProbability * 100)}%</strong>
                  </div>
                  <div>
                    <span>Topical match</span>
                    <strong>{Math.round(rec.topicSimilarity * 100)}%</strong>
                  </div>
                </div>

                <ul className="reason-list">
                  {rec.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>

                <div className="recommendation-footer">
                  <span>{rec.account.followerCount.toLocaleString()} followers</span>
                  <span>{Math.round(rec.account.engagementRate * 100)}% engagement</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="growth-panel">
          <div className="growth-panel__intro">
            <h2>Like & Engagement Boosters</h2>
            <p className="text-secondary">
              Actionable steps that translate recommendations into higher engagement and follower growth.
            </p>
          </div>
          <div className="booster-grid">
            {plan.likeBoosters.map((booster) => (
              <article key={booster.id} className="booster-card">
                <div className="booster-header">
                  <h3>{booster.title}</h3>
                  <span className="booster-lift">{booster.expectedLift}</span>
                </div>
                <p className="text-secondary">{booster.description}</p>
                <ul>
                  {booster.actionItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Growth;

import './EcoHub.scss';

interface ResourceItem {
  name: string;
  description: string;
  keyUse: string;
  link: string;
}

const satelliteResources: ResourceItem[] = [
  {
    name: 'Sentinel Hub API',
    description: 'Cloud API for Sentinel/Landsat imagery processing and EO analytics.',
    keyUse: 'Daily vegetation and NDVI briefing snapshots for eco-alerts.',
    link: 'https://www.sentinel-hub.com/',
  },
  {
    name: 'NASA Earthdata Search',
    description: 'Open NASA dataset portal for products like TEMPO NO2 and GIBS imagery.',
    keyUse: 'Air-quality and radiation telemetry for personalized environmental reports.',
    link: 'https://search.earthdata.nasa.gov/',
  },
  {
    name: 'Copernicus Open Access Hub',
    description: 'Programmatic access to Sentinel SAR and optical Earth observation data.',
    keyUse: 'Flood and wetland monitoring workflows near targeted regions like Lyon.',
    link: 'https://scihub.copernicus.eu/',
  },
  {
    name: 'OpenEO Hub',
    description: 'Multi-provider EO runtime for simplified data pulls and processing.',
    keyUse: 'One-click satellite retrieval pipelines for assistant answers.',
    link: 'https://github.com/ggcr/open-EO-hub',
  },
  {
    name: 'SkyFi Open Data',
    description: 'Free low-resolution satellite imagery app/API for broad global scanning.',
    keyUse: 'Track macro eco-trends for daily digest summaries.',
    link: 'https://app.skyfi.com/welcome',
  },
];

const chatbotRepos: ResourceItem[] = [
  {
    name: 'EcoWise',
    description: 'Gemma2 climate chatbot with RAG and Gradio deployment patterns.',
    keyUse: 'Primary pattern to fork for Laura daily carbon-footprint guidance.',
    link: 'https://github.com/MNLobago/EcoWise',
  },
  {
    name: 'EcoMed-Expert',
    description: 'Llama2 RAG environmental chatbot stack with LangChain + FAISS.',
    keyUse: 'Science-grounded retrieval flow for more reliable eco-advice.',
    link: 'https://github.com/Smit1400/EcoMed-Expert-llama-RAG-chainlit-FAISS',
  },
  {
    name: 'Pandubot',
    description: 'Open-source environmental-awareness chatbot implementation.',
    keyUse: 'Adapt Earth Day conversational scenarios and educational scripts.',
    link: 'https://github.com/abhishtagatya/pandubot',
  },
  {
    name: 'Green AI Standard',
    description: 'Best practices for emission-conscious machine learning development.',
    keyUse: 'Audit and optimize Laura model and inference footprint.',
    link: 'https://github.com/daviddao/green-ai',
  },
  {
    name: 'ML-Carbon-Aware-Computing',
    description: 'Carbon-intensity aware ML scheduling with ElectricityMap inputs.',
    keyUse: 'Run compute-heavy tasks during cleaner grid intervals.',
    link: 'https://github.com/SC92113/ML-Carbon-Aware-Computing',
  },
  {
    name: 'Awesome Chatbots',
    description: 'Curated frameworks and tools for building production-grade bots.',
    keyUse: 'Quickly evaluate Botkit/Botpress for eco-extension architecture.',
    link: 'https://github.com/JStumpp/awesome-chatbots',
  },
];

const coreLinks: ResourceItem[] = [
  {
    name: 'Laura Repository',
    description: 'Primary integration codebase for assistant capabilities.',
    keyUse: 'System of record for implementing EarthDayCelebration enhancements.',
    link: 'https://github.com/Kvnbbg/Laura',
  },
  {
    name: 'Kvnbbg GitHub',
    description: 'Maintainer organization profile with related operational tooling repositories.',
    keyUse: 'Discover supporting utilities (e.g., security scanners) for safer deployments.',
    link: 'https://github.com/Kvnbbg',
  },
  {
    name: 'TechAndStream EarthDayCelebration',
    description: 'Current web wiring and deployment surface for the chatbot experience.',
    keyUse: 'Operational endpoint for daily eco-access and public interactions.',
    link: 'https://www.techandstream.com/home',
  },
  {
    name: 'NASA/ESA MAAP Platform',
    description: 'Open-source biomass and climate analytics collaboration platform.',
    keyUse: 'Future-state advanced climate pipeline and multi-agency dataset ingestion.',
    link: 'https://maap-project.org/',
  },
];

const ResourceGrid = ({ title, items }: { title: string; items: ResourceItem[] }) => (
  <section className="eco-section card">
    <h2>{title}</h2>
    <div className="eco-grid">
      {items.map((item) => (
        <article key={item.name} className="eco-item">
          <h3>{item.name}</h3>
          <p>{item.description}</p>
          <p className="key-use">
            <strong>Key use for Laura:</strong> {item.keyUse}
          </p>
          <a href={item.link} target="_blank" rel="noreferrer noopener">
            Open resource →
          </a>
        </article>
      ))}
    </div>
  </section>
);

const EcoHub = () => {
  return (
    <main className="eco-hub-page">
      <section className="hero card">
        <p className="eyebrow">EarthDayCelebration Ops Hub</p>
        <h1>Eco Integration Command Center</h1>
        <p>
          Curated GitHub repos, APIs, and launch links to accelerate Laura&apos;s daily
          environmental intelligence. Recommended first path: Sentinel Hub for rapid
          satellite visualization plus EcoWise patterns for climate-chatbot delivery via Gradio.
        </p>
      </section>

      <ResourceGrid title="Satellite & Earth Observation APIs" items={satelliteResources} />
      <ResourceGrid title="Eco Chatbot & Low-Carbon AI Repositories" items={chatbotRepos} />
      <ResourceGrid title="Core Project Links" items={coreLinks} />
    </main>
  );
};

export default EcoHub;

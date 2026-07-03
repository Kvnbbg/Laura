/**
 * CitationsPanel — renders sources and fallback links as numbered clickable links.
 *
 * Usage:
 *   <CitationsPanel citations={['https://example.com', 'https://other.com']} />
 *
 * Each URL is displayed as a pill with an index badge and a truncated hostname.
 * Opening always happens in a new tab with noopener noreferrer.
 */

type CitationsPanelProps = {
  citations: string[];
};

const truncateUrl = (url: string): string => {
  try {
    const { hostname, pathname } = new URL(url);
    const path = pathname.length > 28 ? pathname.slice(0, 28) + '…' : pathname;
    return hostname + (pathname === '/' ? '' : path);
  } catch {
    return url.length > 40 ? url.slice(0, 40) + '…' : url;
  }
};

const isHttpUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export function CitationsPanel({ citations }: CitationsPanelProps) {
  if (!citations.length) return null;

  return (
    <div className="chat-widget__citations" aria-label="Sources and links">
      <p className="chat-widget__citations-label">Sources & links</p>
      <ol className="chat-widget__citations-list">
        {citations.map((url, index) => (
          <li key={url} className="chat-widget__citation-item">
            {isHttpUrl(url) ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="chat-widget__citation-link"
                title={url}
              >
                <span className="chat-widget__citation-badge">{index + 1}</span>
                <span className="chat-widget__citation-url">{truncateUrl(url)}</span>
              </a>
            ) : (
              <span className="chat-widget__citation-link" title={url}>
                <span className="chat-widget__citation-badge">{index + 1}</span>
                <span className="chat-widget__citation-url">{truncateUrl(url)}</span>
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

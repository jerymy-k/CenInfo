export default function ProviderBlock({ title, providers, type }) {
  if (!providers?.[type]?.length) return null;

  return (
    <div className="provider-block">
      <p>{title}</p>
      <div className="provider-group">
        {providers[type].map(provider => (
          <a
            key={provider.provider_id}
            href={providers.link}
            target="_blank"
            rel="noreferrer"
            title={provider.provider_name}
            aria-label={provider.provider_name}
          >
            <img
              className="provider-icon"
              src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
              alt={provider.provider_name}
            />
          </a>
        ))}
      </div>
    </div>
  );
}

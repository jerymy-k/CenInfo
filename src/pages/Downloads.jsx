import { useState } from "react";
import { Link } from "react-router-dom";
import { Film, Trash2, PlayCircle, Download } from "lucide-react";
import { useLibrary } from "../context/LibraryContext";

export default function Downloads() {
  const { downloads, removeDownload } = useLibrary();

  return (
    <div className="page-container" style={{ padding: 'clamp(20px, 5vw, 40px)', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: 'var(--gradient-primary)', padding: '12px', borderRadius: '12px', display: 'flex' }}>
          <Download size={28} color="white" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 'clamp(24px, 4vw, 32px)' }}>Downloads</h1>
          <p style={{ margin: '8px 0 0 0', color: 'var(--text-muted)' }}>Watch your saved content offline.</p>
        </div>
      </div>

      {downloads.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <Download size={64} color="var(--text-muted)" />
          <h2 style={{ margin: 0 }}>No Downloads Yet</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: 0 }}>
            You haven't downloaded any movies or TV shows for offline viewing. Find something to watch and click the download button!
          </p>
          <Link to="/discover" className="btn-primary" style={{ textDecoration: 'none' }}>Discover Content</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {downloads.map((item) => (
            <div key={item.downloadId} className="glass-panel hover-card" style={{ display: 'flex', gap: '16px', padding: '16px' }}>
              <Link to={`/movie/${item.imdbID}`} style={{ flexShrink: 0 }}>
                {item.Poster && item.Poster !== "N/A" ? (
                  <img src={item.Poster} alt={item.Title} style={{ width: '80px', height: '120px', borderRadius: '8px', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '80px', height: '120px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Film size={24} color="var(--text-muted)" />
                  </div>
                )}
              </Link>
              
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                <Link to={`/movie/${item.imdbID}`} style={{ textDecoration: 'none', color: 'white', marginBottom: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.Title}</h3>
                </Link>
                <div style={{ color: 'var(--text-secondary)', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span>{item.Type === "series" ? "TV Series" : "Movie"} • {item.Year}</span>
                  {item.episodeInfo && (
                    <span style={{ color: 'var(--accent-amber)', fontWeight: 'bold' }}>
                      S{item.episodeInfo.season} E{item.episodeInfo.episode}: {item.episodeInfo.title}
                    </span>
                  )}
                  <span style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>
                    Downloaded on {new Date(item.downloadedAt).toLocaleDateString()}
                  </span>
                </div>
                
                <div style={{ marginTop: 'auto', display: 'flex', gap: '10px' }}>
                  <Link to={`/movie/${item.imdbID}`} className="btn-primary" style={{ padding: '6px 12px', fontSize: '13px', textDecoration: 'none', flex: 1, justifyContent: 'center' }}>
                    <PlayCircle size={16} style={{ marginRight: '6px' }} /> Watch
                  </Link>
                  <button onClick={() => removeDownload(item.downloadId)} style={{ background: 'rgba(255, 60, 60, 0.1)', color: '#ff6b6b', border: '1px solid rgba(255, 60, 60, 0.3)', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

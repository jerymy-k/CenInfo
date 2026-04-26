import { useState } from "react";
import "./App.css";

const API_KEY = "1aaf70c8";
const BASE_URL = "https://www.omdbapi.com";

export default function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  async function handleTypeChange(newType) {
    setType(newType);
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setSelected(null);
    try {
      const res = await fetch(`${BASE_URL}/?s=${query}&type=${newType}&page=1&apikey=${API_KEY}`);
      const data = await res.json();
      if (data.Response === "True") {
        setResults(data.Search);
        setTotalResults(parseInt(data.totalResults));
        setPage(1);
      } else {
        setResults([]);
        setError(data.Error);
      }
    } catch {
      setError("Something went wrong.");
    }
    setLoading(false);
  }
  async function handleSearch(newPage = 1) {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setSelected(null);
    try {
      const res = await fetch(`${BASE_URL}/?s=${query}&type=${type}&page=${newPage}&apikey=${API_KEY}`);
      const data = await res.json();
      if (data.Response === "True") {
        setResults(data.Search);
        setTotalResults(parseInt(data.totalResults));
        setPage(newPage);
      } else {
        setResults([]);
        setError(data.Error);
      }
    } catch {
      setError("Something went wrong.");
    }
    setLoading(false);
  }

  async function handleSelect(imdbID) {
    setLoading(true);
    setSelected(null);
    const res = await fetch(`${BASE_URL}/?i=${imdbID}&plot=full&apikey=${API_KEY}`);
    const data = await res.json();
    setSelected(data);
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1>🎬 CenInfo</h1>

      <div className="search-bar">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSearch()}
          placeholder="Search movies or series..."
        />
        <button onClick={handleSearch}>Search</button>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: "1.5rem" }}>
        {["", "movie", "series", "episode"].map(t => (
          <button
            key={t}
            onClick={() => handleTypeChange(t)}
            style={{
              padding: "6px 16px",
              borderRadius: 6,
              border: "1px solid #e50914",
              background: type === t ? "#e50914" : "transparent",
              color: type === t ? "white" : "#e50914",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500
            }}
          >
            {t === "" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      {loading && <p className="status">Loading...</p>}
      {error && <p className="error">{error}</p>}

      {selected ? (
        <div>
          <button className="back-btn" onClick={() => setSelected(null)}>← Back</button>
          <div className="detail">
            {selected.Poster !== "N/A" && <img src={selected.Poster} alt={selected.Title} />}
            <div className="detail-info" style={{ flex: 1 }}>
              <h2>{selected.Title} ({selected.Year})</h2>
              <p><b>Genre:</b> {selected.Genre}</p>
              <p><b>Director:</b> {selected.Director}</p>
              <p><b>Actors:</b> {selected.Actors}</p>
              <p><b>IMDb Rating:</b> ⭐ {selected.imdbRating}</p>
              <p><b>Runtime:</b> {selected.Runtime}</p>
              <p style={{ marginTop: 12 }}>{selected.Plot}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid">
          {results.map(movie => (
            <div key={movie.imdbID} className="card" onClick={() => handleSelect(movie.imdbID)}>
              <img
                src={movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/160x240?text=No+Image"}
                alt={movie.Title}
              />
              <div className="card-info">
                <p>{movie.Title}</p>
                <span>{movie.Year}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {results.length > 0 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, marginTop: "2rem" }}>
          <button
            className="back-btn"
            onClick={() => handleSearch(page - 1)}
            disabled={page === 1}
            style={{ opacity: page === 1 ? 0.4 : 1 }}
          >
            ← Prev
          </button>
          <span style={{ color: "#888", fontSize: 14 }}>Page {page} of {Math.ceil(totalResults / 10)}</span>
          <button
            className="back-btn"
            onClick={() => handleSearch(page + 1)}
            disabled={page >= Math.ceil(totalResults / 10)}
            style={{ opacity: page >= Math.ceil(totalResults / 10) ? 0.4 : 1 }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
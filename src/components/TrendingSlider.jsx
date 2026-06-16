import { Link } from "react-router-dom";

export default function TrendingSlider({ movies }) {
  if (!movies?.length) return null;

  const sliderMovies = [...movies, ...movies];

  return (
    <div className="auto-slider-window" aria-label="Trending movies slider">
      <div className="auto-slider-track">
        {sliderMovies.map((movie, index) => (
          <Link
            key={`${movie.imdbID}-${index}`}
            className="auto-slider-card"
            to={`/movie/${movie.imdbID}`}
            style={{ textDecoration: 'none' }}
          >
            <img
              src={movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/240x360?text=No+Poster"}
              alt={movie.Title}
              loading="lazy"
            />
            <div className="auto-slider-info">
              <span>{movie.Type || "movie"}</span>
              <strong title={movie.Title}>{movie.Title}</strong>
              <small>{movie.Year || "Unknown year"}</small>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

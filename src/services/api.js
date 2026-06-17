const API_KEY = import.meta.env.VITE_OMDB_API_KEY;
const BASE_URL = "https://www.omdbapi.com";
const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;

export async function fetchHomeCategories() {
  const endpoints = [
    { key: "trending", label: "Trending Now", url: `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_KEY}` },
    { key: "series", label: "Popular Series", url: `https://api.themoviedb.org/3/trending/tv/week?api_key=${TMDB_KEY}` },
    { key: "action", label: "Action Cinema", url: `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_KEY}&with_genres=28` },
    { key: "comedy", label: "Comedy Picks", url: `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_KEY}&with_genres=35` },
    { key: "documentary", label: "Documentaries", url: `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_KEY}&with_genres=99` },
    { key: "horror", label: "Horror Nights", url: `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_KEY}&with_genres=27` },
  ];

  const results = {};
  await Promise.all(endpoints.map(async ({ key, label, url }) => {
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.results?.length) {
        results[key] = {
          label,
          movies: data.results.map(m => ({
            imdbID: m.imdb_id || (m.title ? `tmdb-movie-${m.id}` : `tmdb-tv-${m.id}`),
            Title: m.title || m.name,
            Year: (m.release_date || m.first_air_date)?.split("-")[0],
            Poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : "https://via.placeholder.com/300x450?text=No+Poster",
            Type: m.title ? "movie" : "series",
          }))
        };
      }
    } catch (e) { console.error(e); }
  }));

  return results;
}

export async function fetchFilteredCategory(newType) {
  let url = "";
  let label = "";
  if (newType === "movie") {
    url = `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_KEY}`;
    label = "Trending Movies";
  } else if (newType === "series") {
    url = `https://api.themoviedb.org/3/trending/tv/week?api_key=${TMDB_KEY}`;
    label = "Trending Series";
  } else if (newType === "documentary") {
    url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_KEY}&with_genres=99`;
    label = "Documentaries";
  } else {
    return null;
  }

  const res = await fetch(url);
  const data = await res.json();
  if (data.results?.length) {
    return {
      label,
      movies: data.results.map(m => ({
        imdbID: m.imdb_id || (newType === "series" ? `tmdb-tv-${m.id}` : `tmdb-movie-${m.id}`),
        Title: m.title || m.name,
        Year: (m.release_date || m.first_air_date)?.split("-")[0],
        Poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : "https://via.placeholder.com/300x450?text=No+Poster",
        Type: newType === "series" ? "series" : "movie",
      }))
    };
  }
  return null;
}

export async function fetchUpcomingMovies() {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/movie/upcoming?api_key=${TMDB_KEY}&language=en-US&page=1`);
    const data = await res.json();
    if (data.results?.length) {
      return {
        label: "Coming Soon",
        movies: data.results.map(m => ({
          imdbID: `tmdb-movie-${m.id}`,
          Title: m.title || m.name,
          Year: (m.release_date || m.first_air_date || "").split("-")[0] || "N/A",
          Poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : "https://via.placeholder.com/300x450?text=No+Poster",
          Type: "movie",
        }))
      };
    }
  } catch (e) { console.error(e); }
  return null;
}

export async function fetchRecommendationsByMovieId(tmdbId, mediaType = "movie") {
  if (!tmdbId) return null;
  try {
    const res = await fetch(`https://api.themoviedb.org/3/${mediaType}/${tmdbId}/recommendations?api_key=${TMDB_KEY}`);
    const data = await res.json();
    if (data.results?.length) {
      return {
        label: "For You",
        movies: data.results.slice(0, 10).map(m => ({
          imdbID: `tmdb-${mediaType}-${m.id}`,
          Title: m.title || m.name,
          Year: (m.release_date || m.first_air_date || "").split("-")[0] || "N/A",
          Poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : "https://via.placeholder.com/300x450?text=No+Poster",
          Type: mediaType,
        }))
      };
    }
  } catch (e) { console.error(e); }
  return null;
}

export async function searchMovies(query, type, page = 1, year = "") {
  if (!query.trim()) return { results: [], totalResults: 0, error: "" };
  
  const omdbPage1 = Math.ceil((page * 12 - 11) / 10);
  const omdbPage2 = Math.ceil((page * 12) / 10);
  const typeParam = type === "documentary" ? "movie" : type;
  const yearQuery = year ? `&y=${year}` : "";

  try {
    const res1 = await fetch(`${BASE_URL}/?s=${query}&type=${typeParam}${yearQuery}&page=${omdbPage1}&apikey=${API_KEY}`);
    const data1 = await res1.json();

    let combined = [];
    let total = 0;

    if (data1.Response === "True") {
      combined = data1.Search;
      total = parseInt(data1.totalResults);

      if (omdbPage2 !== omdbPage1) {
        const res2 = await fetch(`${BASE_URL}/?s=${query}&type=${typeParam}${yearQuery}&page=${omdbPage2}&apikey=${API_KEY}`);
        const data2 = await res2.json();
        if (data2.Response === "True") {
          combined = [...combined, ...data2.Search];
        }
      }

      const startIndex = ((page - 1) * 12) % 10;
      return {
        results: combined.slice(startIndex, startIndex + 12),
        totalResults: total,
        error: ""
      };
    } else {
      return { results: [], totalResults: 0, error: data1.Error };
    }
  } catch (error) {
    return { results: [], totalResults: 0, error: "Something went wrong." };
  }
}

export async function fetchMovieDetails(imdbID) {
  let realImdbID = imdbID;
  let tmdbMediaType = "movie";
  let tmdbId = null;

  try {
    if (imdbID.startsWith("tmdb-")) {
      if (imdbID.startsWith("tmdb-tv-")) {
        tmdbMediaType = "tv";
        tmdbId = imdbID.replace("tmdb-tv-", "");
      } else if (imdbID.startsWith("tmdb-movie-")) {
        tmdbMediaType = "movie";
        tmdbId = imdbID.replace("tmdb-movie-", "");
      } else {
        tmdbId = imdbID.replace("tmdb-", "");
      }

      let extRes = await fetch(`https://api.themoviedb.org/3/${tmdbMediaType}/${tmdbId}/external_ids?api_key=${TMDB_KEY}`);
      let extData = await extRes.json();

      if (!extData.imdb_id && tmdbMediaType === "movie") {
        // Fallback for legacy "tmdb-" IDs without type
        extRes = await fetch(`https://api.themoviedb.org/3/tv/${tmdbId}/external_ids?api_key=${TMDB_KEY}`);
        extData = await extRes.json();
      }
      realImdbID = extData.imdb_id;
    }

    if (!realImdbID) {
      return { error: "Full movie details were not found.", data: null };
    }

    const res = await fetch(`${BASE_URL}/?i=${realImdbID}&plot=full&apikey=${API_KEY}`);
    const data = await res.json();

    if (data.Response === "False") {
      return { error: data.Error || "Full movie details were not found.", data: null };
    }

    const mediaType = data.Type === "series" ? "tv" : "movie";
    const cleanYear = data.Year?.split("–")[0]?.split("-")[0];
    
    // Find TMDB ID if we didn't have it
    if (!tmdbId) {
      const searchUrl = mediaType === "tv"
        ? `https://api.themoviedb.org/3/search/tv?query=${encodeURIComponent(data.Title)}&first_air_date_year=${cleanYear}&api_key=${TMDB_KEY}`
        : `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(data.Title)}&year=${cleanYear}&api_key=${TMDB_KEY}`;
        
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();
      if (searchData.results?.length) {
        tmdbId = searchData.results[0].id;
      }
    }

    return { 
      data, 
      error: null,
      mediaType,
      tmdbId,
      cleanYear
    };
  } catch (err) {
    return { error: "Something went wrong.", data: null };
  }
}

export async function fetchTrailer(title, year, mediaType = "movie") {
  try {
    const searchUrl = mediaType === "tv"
      ? `https://api.themoviedb.org/3/search/tv?query=${encodeURIComponent(title)}&first_air_date_year=${year}&api_key=${TMDB_KEY}`
      : `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(title)}&year=${year}&api_key=${TMDB_KEY}`;

    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    if (!searchData.results?.length) return null;

    const tmdbId = searchData.results[0].id;
    const videoRes = await fetch(`https://api.themoviedb.org/3/${mediaType}/${tmdbId}/videos?api_key=${TMDB_KEY}`);
    const videoData = await videoRes.json();
    const trailer = videoData.results?.find(v => v.type === "Trailer" && v.site === "YouTube");
    return trailer ? `https://www.youtube.com/embed/${trailer.key}` : null;
  } catch {
    return null;
  }
}

export async function fetchProviders(tmdbId, mediaType = "movie") {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/${mediaType}/${tmdbId}/watch/providers?api_key=${TMDB_KEY}`);
    const data = await res.json();
    return data.results?.MA || data.results?.US || null;
  } catch {
    return null;
  }
}

export async function fetchRecommendations(tmdbId, mediaType = "movie") {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/${mediaType}/${tmdbId}/recommendations?api_key=${TMDB_KEY}`);
    const data = await res.json();
    if (data.results?.length) {
      return data.results.map(m => ({
        imdbID: m.imdb_id || `tmdb-${m.id}`,
        Title: m.title || m.name,
        Year: (m.release_date || m.first_air_date)?.split("-")[0],
        Poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : "https://via.placeholder.com/300x450?text=No+Poster",
        Type: m.title ? "movie" : "series",
      }));
    }
    return [];
  } catch {
    return [];
  }
}

export async function fetchEpisodes(imdbID, seasonNumber) {
  try {
    const res = await fetch(`${BASE_URL}/?i=${imdbID}&Season=${seasonNumber}&apikey=${API_KEY}`);
    const data = await res.json();

    if (data.Response === "True" && data.Episodes?.length) {
      return data.Episodes;
    }
    return [];
  } catch {
    return [];
  }
}

export async function fetchCast(tmdbId, mediaType = "movie") {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/${mediaType}/${tmdbId}/credits?api_key=${TMDB_KEY}`);
    const data = await res.json();
    return data.cast?.slice(0, 15) || [];
  } catch {
    return [];
  }
}

export async function fetchReviews(tmdbId, mediaType = "movie") {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/${mediaType}/${tmdbId}/reviews?api_key=${TMDB_KEY}`);
    const data = await res.json();
    return data.results?.slice(0, 10) || [];
  } catch {
    return [];
  }
}

export async function fetchActorDetails(personId) {
  try {
    const [personRes, creditsRes] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/person/${personId}?api_key=${TMDB_KEY}`),
      fetch(`https://api.themoviedb.org/3/person/${personId}/combined_credits?api_key=${TMDB_KEY}`)
    ]);
    const person = await personRes.json();
    const credits = await creditsRes.json();
    
    // Sort credits by popularity
    const sortedCredits = (credits.cast || []).sort((a, b) => b.popularity - a.popularity).map(item => ({
      imdbID: `tmdb-${item.media_type || 'movie'}-${item.id}`, // Using TMDB ID for routing
      Title: item.title || item.name,
      Year: (item.release_date || item.first_air_date || "").split("-")[0] || "N/A",
      Poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "N/A",
      Type: item.media_type,
      imdbRating: item.vote_average?.toFixed(1) || "N/A",
    }));

    return {
      name: person.name,
      biography: person.biography,
      profile_path: person.profile_path,
      birthday: person.birthday,
      place_of_birth: person.place_of_birth,
      known_for_department: person.known_for_department,
      credits: sortedCredits
    };
  } catch (error) {
    console.error("Error fetching actor details:", error);
    return null;
  }
}

export async function fetchAdvancedDiscover(type, genre, year, minRating, page = 1) {
  try {
    let url = `https://api.themoviedb.org/3/discover/${type}?api_key=${TMDB_KEY}&page=${page}&sort_by=popularity.desc`;
    if (genre) url += `&with_genres=${genre}`;
    if (year) {
      if (type === "movie") url += `&primary_release_year=${year}`;
      else url += `&first_air_date_year=${year}`;
    }
    if (minRating) url += `&vote_average.gte=${minRating}`;

    const res = await fetch(url);
    const data = await res.json();
    
    const results = data.results.map(item => ({
      imdbID: `tmdb-${type}-${item.id}`,
      Title: item.title || item.name,
      Year: (item.release_date || item.first_air_date || "").split("-")[0] || "N/A",
      Poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "N/A",
      Type: type,
      imdbRating: item.vote_average?.toFixed(1) || "N/A"
    }));

    return { results, totalPages: data.total_pages };
  } catch (error) {
    console.error("Error fetching discover data:", error);
    return { results: [], totalPages: 1 };
  }
}

export async function fetchMovieCollection(collectionId) {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/collection/${collectionId}?api_key=${TMDB_KEY}`);
    const data = await res.json();
    
    if (!data.parts) return null;

    // Sort chronologically by release date
    const sortedParts = data.parts.sort((a, b) => new Date(a.release_date || 0) - new Date(b.release_date || 0));

    return {
      name: data.name,
      overview: data.overview,
      backdrop: data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : null,
      parts: sortedParts.map(item => ({
        imdbID: `tmdb-movie-${item.id}`, // Using TMDB ID for routing
        Title: item.title,
        Year: (item.release_date || "").split("-")[0] || "N/A",
        Poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "N/A",
        Type: "movie",
        imdbRating: item.vote_average?.toFixed(1) || "N/A",
      }))
    };
  } catch (error) {
    console.error("Error fetching collection:", error);
    return null;
  }
}

export async function fetchTmdbMovieInfo(tmdbId, mediaType = "movie") {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/${mediaType}/${tmdbId}?api_key=${TMDB_KEY}`);
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchLiveSearch(query) {
  if (!query || query.length < 2) return [];
  try {
    const res = await fetch(`https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(query)}&api_key=${TMDB_KEY}`);
    const data = await res.json();
    return (data.results || [])
      .filter(item => item.media_type === "movie" || item.media_type === "tv")
      .slice(0, 6)
      .map(item => ({
        imdbID: `tmdb-${item.media_type}-${item.id}`,
        Title: item.title || item.name,
        Type: item.media_type === "tv" ? "series" : "movie",
        Year: (item.release_date || item.first_air_date || "").split("-")[0] || "N/A",
        Poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
        Backdrop: item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}` : null,
        imdbRating: item.vote_average?.toFixed(1) || "N/A",
        Overview: item.overview || ""
      }));
  } catch {
    return [];
  }
}

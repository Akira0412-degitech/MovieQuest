import React, { useEffect, useState } from 'react';
import api from '/api'; // 上で作ったAPI設定を読み込む

function MovieList() {
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    api.get('/movies/search')
      .then((response) => {
        setMovies(response.data);
      })
      .catch((error) => {
        console.error('Error fetching movies:', error);
      });
  }, []);

  return (
    <div>
      <h2>Movie List</h2>
      <ul>
        {movies.map((movie) => (
          <li key={movie.id}>{movie.title}</li>
        ))}
      </ul>
    </div>
  );
}

export default MovieList;

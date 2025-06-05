import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-balham.css';
import { ClientSideRowModelModule } from 'ag-grid-community';
import '../App.css';
import React from 'react';


function MovieDetail() {
  const { imdbID } = useParams();
  const [movie, setMovie] = useState(null);
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  const columns = [
    { headerName: "Name", 
      field: "name", 
      flex: 1,
      cellRenderer: (params) => {
        return(
          <a className='clickable-link'
          onClick={() => navigate(`/person/${params.data.id}`)}>
            {params.value}
          </a>
        )
      }},
    { headerName: "Role", field: "category", flex: 1 },
    { headerName: "Character", field: "characters" }
  ];

  useEffect(() => {
    axios
      .get(`http://4.237.58.241:3000/movies/data/${imdbID}`)
      .then((res) => {
        console.log(res.data);
        setMovie(res.data);
      })
      .catch((err) => {
        console.error(err);
      });
  }, [imdbID]);

  if (!movie) return <p>Loading...</p>;

  const filteredCategories = ["editor", "actor", "actress", "director"];
  const grouped = movie.principals.reduce((acc, person) => {
    if (filteredCategories.includes(person.category)) {
      if (!acc[person.category]) acc[person.category] = [];
      acc[person.category].push(person);
    }
    return acc;
  }, {});

  const categoryLabels = {
    editor: "Editor",
    director: "Director",
    actor: "Acotor",
    actress: "Actress",
  };

  return (
    <div className="fullscreen">
      <div className="movie-detail-card">
        <div className="movie-detail-poster image-frame">
          {!imageError ? (
            <img 
            src={movie.poster}
            alt={`${movie.title}Poster`}
            className='movie-poster-image'
            onError={() => setImageError(true)}
            />

          ): (
            <p className='no-image-text'>No image Available</p>
          )}
          
        </div>

        <div className="movie-detail-info text-body">
          <h1>
            {movie.title}
            <span className="subtitle">Produced in {movie.year}</span>
          </h1>

          <ul className="movie-detail-list">
            <li><strong>Country:</strong> {movie.country} / <strong>Runtime:</strong> {movie.runtime} minutes</li>
            <li><strong>Genres:</strong> {movie.genres.map((genre, index) => (
            <span key={index} className="genre-tag">{genre}</span>
            ))}
            </li>
            <li><strong>Box Office:</strong> {movie.boxoffice != null ? movie.boxoffice.toLocaleString() + "$" : 'N/A'}</li>
            <li><strong>Plot:</strong> {movie.plot}</li>
          </ul>

          <div className="mini-ratings">
            {movie.ratings.map((rating, index) => {
              const value = rating.value ?? "No data";
              let display = value;
              let icon = "❓";
              let label = rating.source;
              let className = "mini-rating-card";

              if (rating.source === "Internet Movie Database") {
                icon = "⭐"; label = "IMDb"; className += " imdb";
                if (value != null) display += " / 10";
              } else if (rating.source === "Rotten Tomatoes") {
                icon = "🍅"; label = "Rotten Tomatoes"; className += " rotten";
                if (value != null) display += "%";
              } else if (rating.source === "Metacritic") {
                icon = "📝"; label = "Metacritic"; className += " metacritic";
                if (value != null) display += " / 100";
              }

              return (
                <div key={index} className={className}>
                  <p className="source">{icon}</p>
                  <p className="rating-label">{label}</p>
                  <p className="value">{display}</p>
                </div>
              );
            })}
          </div>

          <div className="role-sections">
            {Object.keys(grouped).map((category) => (
              <div key={category} className="role-group">
                <h3>{categoryLabels[category]}</h3>
                <div className="person-tags">
                  {grouped[category].map((person) => (
                    <div className="person-tag" key={person.id}>
                      <strong>{person.name}</strong>
                      {person.characters?.length > 0 && person.characters[0] && (
                        <span className="character-name">
                          {person.characters.join(", ")}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <h2 className='movie-detail-text-casts'>Cast and Crew</h2>
      <div className="ag-theme-balham" style={{ width: '100%', marginTop: '20px' }}>
        <AgGridReact
          columnDefs={columns}
          rowData={movie.principals}
          domLayout="autoHeight"
          modules={[ClientSideRowModelModule]}
        />
      </div>
    </div>
  );
}

export default MovieDetail;

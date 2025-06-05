import { useState, useRef } from 'react';
import axios from 'axios';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-balham.css';
import { InfiniteRowModelModule } from 'ag-grid-community';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import React from 'react';


function Movies() {
  const navigate = useNavigate();
  const gridRef = useRef();

  const [searchText, setSearchText] = useState('');
  const [searchYear, setSearchYear] = useState('');
  const [totalMovies, setTotalMovies] = useState(0);

  const columns = [
    { headerName: "Title", field: "title", flex: 1,
      cellRenderer: (params) => {
        return (
        <a className="clickable-link" 
        onClick={() => navigate(`/movies/data/${params.data.imdbID}`)}>
        {params.value}
        </a>);}
    },
    { headerName: "Year", field: "year", width: 100 },
    { headerName: "Rated", field: "classification", width: 130, valueFormatter: params => params.value || "No Data" },
    { headerName: "IMDb", field: "imdbRating", width: 100, valueFormatter: params => params.value || "No Data" },
    { headerName: "Rotten", field: "rottenTomatoesRating", width: 100, valueFormatter: params => params.value != null ? `${params.value}%` : "No Data"},
    { headerName: "Metacritic", field: "metacriticRating", width: 100, valueFormatter: params => params.value || "No Data" },
  ]; 

  const handleSearch = (title = searchText, year = searchYear) => {
    const datasource = {
      getRows: (gridParams) => {
        const page = Math.floor(gridParams.startRow / 100) + 1;
        const queryParams = new URLSearchParams();
        if (title) queryParams.append('title', title);
        if (year) queryParams.append('year', year);
        queryParams.append('page', page);

        axios.get(`http://4.237.58.241:3000/movies/search?${queryParams}`)
          .then(res => {
            gridParams.successCallback(res.data.data, res.data.pagination.total);
            setTotalMovies(res.data.pagination.total)
          })
          .catch(() => gridParams.failCallback());
      }
    };

    gridRef.current.api.setGridOption('datasource', datasource);
    gridRef.current.api.purgeInfiniteCache();
  };

  const onGridReady = () => {
    handleSearch();
  };

  const handleReset = () => {
    setSearchText('');
    setSearchYear('');
    handleSearch('', '');
  };



  return (
    <div style={{ padding: "30px" }}>
      <h1 className='text-heading'>All Movies</h1>
      <input className='input-bar'
        type="text"
        placeholder="Filter by title"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        style={{ marginRight: '10px', padding: '5px' }}
      />
      <input className='input-bar'
        type="text"
        placeholder="Filter by year"
        value={searchYear}
        onChange={(e) => setSearchYear(e.target.value)}
        style={{ marginRight: '10px', padding: '5px' }}
      />
      <button className="btn-main" onClick={() => handleSearch()}>
        Search
      </button>
      <button className="btn-main" onClick={handleReset}>
        Clear
      </button>
      <p className='total-movies'>{totalMovies} movies matched</p>
      <div className="ag-theme-balham" style={{ height: 500, width: 1000, margin: 'auto' }}>
        <AgGridReact
          ref={gridRef}
          columnDefs={columns}
          rowModelType="infinite"
          onGridReady={onGridReady}
          cacheBlockSize={100}
          maxBlocksInCache={2}
          modules={[InfiniteRowModelModule]}
          overlayNoRowsTemplate="<span style='padding: 10px;'>No Data</span>"
        />
      </div>
    </div>
  );
}

export default Movies;

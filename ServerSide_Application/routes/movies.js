const express = require("express");
const router = express.Router();

// GET /movies/search
router.get("/search", async (req, res) => {
  const db = req.db;
  let { title, year, page } = req.query;
  let year_int;

  if (year) {
    if (!/^\d{4}$/.test(year)) {
      return res.status(400).json({
        error: true,
        message: "Invalid year format. Format must be yyyy.",
      });
    }
    year_int = parseInt(year);
  }

  if (page && !/^\d+$/.test(page)) {
    return res.status(400).json({
      error: true,
      message: "Invalid page format. page must be a number.",
    });
  }

  page = parseInt(page) || 1;


  const perPage = 100;
  const offset = (page - 1) * perPage;

  try {
    const countQuery = db("basics");
    if (title) {
      countQuery.where("PrimaryTitle", "like", `%${title}%`);
    }
    if (year_int) {
      countQuery.andWhere("year", year_int);
    }

    const countResult = await countQuery.count("tconst as count").first();
    const totalCount = parseInt(countResult.count);
    const totalPages = Math.ceil(totalCount / perPage);

    const dataQuery = db("basics")
      .select(
        "PrimaryTitle as title",
        "year",
        "tconst as imdbID",
        "imdbRating",
        "rottentomatoesRating as rottenTomatoesRating",
        "metacriticRating",
        "rated as classification"
      );
    if (title) {
      dataQuery.where("PrimaryTitle", "like", `%${title}%`);
    }
    if (year_int) {
      dataQuery.andWhere("year", year_int);
    }

    const results = await dataQuery.limit(perPage).offset(offset);

    return res.status(200).json({
      data: results.map(item => ({
        ...item,
        imdbRating: item.imdbRating ? Number(item.imdbRating) : null,
        rottenTomatoesRating: item.rottenTomatoesRating ? Number(item.rottenTomatoesRating) : null,
        metacriticRating: item.metacriticRating ? Number(item.metacriticRating) : null
              })),
      pagination: {
        total: totalCount,
        lastPage: totalPages,
        perPage,
        currentPage: page,
        from: offset,
        to: offset + results.length,
        nextPage: page < totalPages ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null
      },
    });
  } catch (err) {
    console.error("Error Occurred", err);
    res.status(500).json({ error: true, message: "Server error" });
  }
});

router.get("/data/:imdbID", async (req, res) => {
  const db = req.db;
  const { imdbID } = req.params;

  if (!imdbID) {
    return res.status(400).json({
      error: true,
      message: "Missing 'imdbID' query parameter",
    });
  }
  const pattern = /^tt\d{7,}$/;
  if (!pattern.test(imdbID)) {
    return res.status(404).json({
      error: true,
      message:
        "Invalid query parameters:",
    });
  }

  if (Object.keys(req.query).length > 0) {
  return res.status(400).json({
    error: true,
    message: `Invalid query parameters: ${Object.keys(req.query).join(", ")}. Query parameters are not permitted.`,
  });
}

  try {
    const movie = await db("basics")
      .select(
        "primaryTitle as title",
        "year",
        "runtimeMinutes as runtime",
        "genres",
        "country",
        "boxoffice",
        "poster",
        "plot"
      )
      .where("tconst", imdbID)
      .first();

    if (!movie) {
      return res.status(404).json({
        error: true,
        message: "No record exists of a movie with this ID",
      });
    }
    const genres = movie.genres
      ? movie.genres.split(",").map((g) => g.trim())
      : [];

    const ratings = await db("ratings")
      .select("source", "value")
      .where("tconst", imdbID);
    
    ratings.forEach(r => {
      if (typeof r.value === "string" && r.value.includes("/")) {
        const [num] = r.value.split("/");
        r.value = parseFloat(num);
      } else {
        r.value = parseFloat(r.value);
      }
    });
    const participants = await db("principals as p")
      .select("nconst as id", "category", "name", "characters")
      .where("tconst", imdbID);

    participants.forEach((p) => {
      if (p.characters) {
        p.characters = p.characters
          .slice(2, -2)
          .split(",")
          .map((c) => c.trim());
      } else {
        p.characters = [];
      }
    });
    return res.status(200).json({
      title: movie.title,
      year: movie.year,
      runtime: movie.runtime,
      genres: genres,
      country: movie.country,
      principals: participants,
      ratings: ratings,
      boxoffice: movie.boxoffice,
      poster: movie.poster,
      plot: movie.plot,
    })

  } catch (err) {
    console.error("Error Occured", err);
    res.status(500).json({ error: true, message: "Server Error" });
  }
});
module.exports = router;

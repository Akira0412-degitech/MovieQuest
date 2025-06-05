const express = require('express');
const router = express.Router();

const authorization = require("../middleware/authorization"); 

router.get('/:id', authorization, async (req, res) => {
    const db = req.db;
    const { id } = req.params;

    if (Object.keys(req.query).length > 0) {
      return res.status(400).json({
        error: true,
        message: `Invalid query parameters: ${Object.keys(req.query).join(', ')}. Query parameters are not permitted.`,
      });
    }


    if (!id) {
    return res.status(400).json({
      error: true,
      message:  "Invalid query parameters: Id required,"
    });
  }


  try{
    const person = await db("names")
    .select(
        "primaryName as name",
        "birthYear",
        "deathYear",
        "knownForTitles as roles"
    )
    .where('nconst', id )
    .first()

   if(!person){
        return res.status(404).json({
      error: true,
      message:  "No record exists of a person with this ID"
    });
    }

    const pattern = /^nm\d{7}$/;
    if (!pattern.test(id)) {
      return res.status(400).json({
        error: true,
        message:
          "Invalid query parameters:",
      });
    }

    const rawRoles = await db('principals as p')
      .join('basics as b', 'p.tconst', 'b.tconst')
      .where('p.nconst', id)
      .select(
        'b.primaryTitle as movieName',
        'b.tconst as movieId',
        'p.category',
        'p.characters',
        'b.imdbRating'
      );

    
    const roles = rawRoles.map(role => ({
        movieName: role.movieName,
        movieId: role.movieId,
        category: role.category,
        characters: (() => {
            try {
            return JSON.parse(role.characters || '[]');
            } catch {
            return [];
            }
        })(),
        imdbRating: role.imdbRating ? Number(role.imdbRating) : null
        }));
    
    return res.status(200).json({
        name: person.name,
        birthYear: person.birthYear,
        deathYear: person.deathYear,
        roles: roles
    })

  }catch(err){
    console.error("Error Occured", err)
    res.status(500).json({error: true, message: "Server Error"})
  }
  
})

module.exports = router;
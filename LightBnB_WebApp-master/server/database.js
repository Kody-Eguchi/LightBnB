const properties = require('./json/properties.json');
const users = require('./json/users.json');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'kojieguchi',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

// pool.query(`SELECT title FROM properties LIMIT 10;`).then(response => {console.log(response)});
/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  const queryString = `
  SELECT * 
  FROM users
  WHERE email = $1;
  `;

  return pool
    .query(queryString, [email])
    .then((result) => {
      console.log(result.rows);
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
      return null;
    });



  // let user;
  // for (const userId in users) {
  //   user = users[userId];
  //   if (user.email.toLowerCase() === email.toLowerCase()) {
  //     break;
  //   } else {
  //     user = null;
  //   }
  // }
  // return Promise.resolve(user);


 
}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  
  const queryString = `
    SELECT *
    FROM users
    WHERE id = $1;
  `;
  return pool
    .query(queryString, [id])
    .then((res) => {
      console.log(res.rows)
      return res.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
      return null;
    });
}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
  // const userId = Object.keys(users).length + 1;
  // user.id = userId;
  // users[userId] = user;
  // return Promise.resolve(user);
  const {name, email, password} = user;
  const values = [name, email, password];
  const queryString =`
    INSERT INTO users (name, email, password)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  
  return pool
    .query(queryString, values)
    .then(res => {
      console.log(res.rows)
      return res.rows
    })
    .catch(err => {
      console.log(err.message);
      return null;
    })

}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  // return getAllProperties(null, 2);
  const queryString = `
    SELECT *
    FROM reservations
    WHERE guest_id = $1
    LIMIT $2;
  `;

  const values = [guest_id, limit];
  return pool
    .query(queryString, values)
    .then(res => {
      console.log(res.rows);
      return res.rows;
    })
    .catch(err => {
      console.log(err.message);
      return null;
    });

}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = (options, limit = 10) => {

  const queryParams = [];

  let {
    city,
    owner_id,
    minimum_price_per_night,
    maximum_price_per_night,
    minimum_rating
  } = options;

  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  
  if (city) {
    queryParams.push(`%${city}%`);
    queryString += `WHERE city LIKE $${queryParams.length} `;
  }

  if (owner_id) {
    if (queryParams.length === 0) {
      queryParams.push(owner_id);
      queryString += `WHERE owner_id = $${queryParams.length} `
    } else {
      queryParams.push(owner_id);
      queryString += `AND owner_id = $${queryParams.length} `
    }
  }
  
  if (minimum_price_per_night) {
    minimum_price_per_night = minimum_price_per_night * 100;
    if (queryParams.length === 0) {
      queryParams.push(minimum_price_per_night);
      queryString += `WHERE cost_per_night > $${queryParams.length} `
    } else {
      queryParams.push(minimum_price_per_night);
      queryString += `AND cost_per_night > $${queryParams.length} `
    }
  }

  if (maximum_price_per_night) {
    maximum_price_per_night = maximum_price_per_night * 100;
    if (queryParams.length === 0) {
      queryParams.push(maximum_price_per_night);
      queryString += `WHERE cost_per_night < $${queryParams.length} `
    } else {
      queryParams.push(maximum_price_per_night);
      queryString += `AND cost_per_night < $${queryParams.length} `
    }
  }


  queryString += `
  GROUP BY properties.id
  `;

  if (minimum_rating) {
    queryParams.push(minimum_rating);
    queryString += `HAVING avg(property_reviews.rating) > $${queryParams.length} `
  }
  
  queryParams.push(limit);
  queryString += `
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;
  
  console.log(queryString, queryParams);

  return pool
    .query(queryString, queryParams)
    .then((result) => {
      console.log(result.rows);
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
};
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  
  const {
    owner_id,
    title,
    description,
    thumbnail_photo_url,
    cover_photo_url,
    cost_per_night,
    street,
    city,
    province,
    post_code,
    country,
    parking_spaces,
    number_of_bathrooms,
    number_of_bedrooms
  } = property;

  const queryParams = [
    title,
    description,
    owner_id,
    cover_photo_url,
    thumbnail_photo_url,
    cost_per_night,
    parking_spaces,
    number_of_bathrooms,
    number_of_bedrooms,
    province,
    city,
    country,
    street,
    post_code

  ];

  const queryString = `
  INSERT INTO properties (
    title,
    description,
    owner_id,
    cover_photo_url,
    thumbnail_photo_url,
    cost_per_night,
    parking_spaces,
    number_of_bathrooms,
    number_of_bedrooms,
    province,
    city,
    country,
    street,
    post_code
    ) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *;
  `;

  return pool
    .query(queryString, queryParams)
    .then((result) => {
      console.log(result.rows[0]);
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });

}
exports.addProperty = addProperty;

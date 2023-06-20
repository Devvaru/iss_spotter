const request = require('request');

const fetchMyIP = function(callback) {

  request('https://api.ipify.org?format=json', function(error, response, body) {

    // error can be set if invalid domain, user is offline, etc.
    if (error) {
      return callback(error, null);
    }

    // if non-200 status, assume server error
    if (response.statusCode !== 200) {
      const msg = `Status Code ${response.statusCode} when fetching IP. Response: ${body}`;
      callback(Error(msg), null);
      return;
    }

    // isolate just the IP
    const ip = JSON.parse(body).ip;
    callback(null, ip);

  });
};

const fetchCoordsByIP = function(ip, callback) {
  request(`http://ipwho.is/${ip}`, function(error, response, body) {

    if (error) {
      return callback(error, null);
    }

    const parsedBody = JSON.parse(body);

    if (!parsedBody.success) {
      const message = `Success status was ${parsedBody.success}. Server message says: ${parsedBody.message} when fetching for IP ${parsedBody.ip}`;
      callback(Error(message), null);
      return;
    }

    const { latitude, longitude } = parsedBody;

    callback(null, { latitude, longitude });

  });
};

const fetchISSFlyOverTimes = function(coords, callback) {
  request(`https://iss-flyover.herokuapp.com/json/?lat=${coords.latitude}&lon=${coords.longitude}`, function(error, response, body) {

    if (error) {
      return callback(error, null);
    }

    if (response.statusCode !== 200) {
      callback(Error(`Status Code ${response.statusCode} when fetching ISS pass times: ${body}`), null);
      return;
    }

    const passes = JSON.parse(body).response;
    callback(null, passes);
  });
};



const nextISSTimesForMyLocation = function(callback) {

  fetchMyIP((error, ip) => {

    if (error) {
      return callback(error);
    }

    fetchCoordsByIP(ip, (error, loc) => {
      if (error) {
        return callback(error);
      }

      fetchISSFlyOverTimes(loc, (error, nextPasses) => {
        if (error) {
          return callback(error);
        }

        callback(null, nextPasses);
      });
    });
  });
};

module.exports = { nextISSTimesForMyLocation };
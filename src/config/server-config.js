const dotenv = require('dotenv');

dotenv.config();

module.exports = {
    PORT: 4000,
    FLIGHT_SERVICE_URL : "http://localhost:3000"
}
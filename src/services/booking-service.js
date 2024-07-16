const axios = require('axios');
const {StatusCodes} = require('http-status-codes');

const { BookingRepository } = require('../repositories');
const { ServerConfig, Queue } = require('../config')
const db = require('../models');
const AppError = require('../utils/errors/app-error');
const {Enums} = require('../utils/common');
const { BOOKED, CANCELLED } = Enums.BOOKING_STATUS;
const  axiosInstance = require('../config/axiosInstance');



const bookingRepository = new BookingRepository();

const FLIGHT_SERVICE_URL = `${ServerConfig.FLIGHT_SERVICE_URL}/api/v1`;

async function createBooking(data) {
    console.log('Input data:', data); // Log input data
    if (!data || !data.flightId) {
        throw new Error('Invalid data provided to createBooking');
    }
    const transaction = await db.sequelize.transaction();
    try {
        const uri = FLIGHT_SERVICE_URL + `/flights/${data.flightId}`;
        const flight = await axios.get(uri);
        console.log(flight.data);
        // const flightData = flight.data;
        // console.log(flightData);
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}





module.exports = {
    createBooking,
}
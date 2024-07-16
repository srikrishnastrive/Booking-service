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
        const flightData = flight.data.SuccessResponse.data;
        console.log(flightData);
        if(data.noofSeats > flightData.totalSeats){
            throw new AppError("Not enough seats available",StatusCodes.BAD_REQUEST);
        }
        return true;
        // console.log(flight.totalSeats);
        // // const flightData = flight.data;
        // // console.log(flightData);
    } catch (error) {
        console.log(error);
        //await transaction.rollback();
        throw error;
    }
}





module.exports = {
    createBooking,
}
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
    //un managed transaction
    const transaction = await db.sequelize.transaction();
    try {
        const uri = FLIGHT_SERVICE_URL + `/flights/${data.flightId}`;
        const flight = await axios.get(uri);
        const flightData = flight.data.SuccessResponse.data;
        // console.log(flightData);
        if(data.noOfSeats > flightData.totalSeats){
            throw new AppError("Not enough seats available",StatusCodes.BAD_REQUEST);
        }
        const totalBillingAmount = data.noOfSeats * flightData.price;
        const bookingPayload = {...data,totalCost:totalBillingAmount};
        const booking = await bookingRepository.create(bookingPayload,transaction);
        const bookSeatsuri = FLIGHT_SERVICE_URL + `/flights/${data.flightId}/seats`;
        await axios.patch(bookSeatsuri,{seats:data.noOfSeats});

        await transaction.commit();
        return booking;
      
    } catch (error) {
        console.log(error);
        await transaction.rollback();
        throw error;
    }
}





module.exports = {
    createBooking,
}
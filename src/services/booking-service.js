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

async function makePayment(data) {
    const transaction = await db.sequelize.transaction();
    console.log(data);
    try {

        const bookingDetails = await bookingRepository.get(data.bookingId, transaction);
        if(bookingDetails.status == CANCELLED) {
            throw new AppError('The booking has expired', StatusCodes.BAD_REQUEST);
        }
        console.log(bookingDetails);
        //we are giving the user for booking the flight ticket just created at 1:20 and we are allowing 1:25 minutes onlu
        //after that we are cancelling booking.
        const bookingTime = new Date(bookingDetails.createdAt);
        const currentTime = new Date();
        //5 minutes in milliseconds
        if(currentTime - bookingTime > 300000){
            await bookingRepository.update(data.bookingId, {status: CANCELLED}, transaction);
            throw new AppError('The booking has expired', StatusCodes.BAD_REQUEST);

        }
       
        if(bookingDetails.totalCost != data.totalCost) {
            throw new AppError('The amount of the payment doesnt match', StatusCodes.BAD_REQUEST);
        }
        if(bookingDetails.userId != data.userId) {
            throw new AppError('The user corresponding to the booking doesnt match', StatusCodes.BAD_REQUEST);
        }
        // we assume here that payment is successful
        await bookingRepository.update(data.bookingId, {status: BOOKED}, transaction);
        await transaction.commit();
        
    } catch(error) {
        await transaction.rollback();
        throw error;
    }
}




module.exports = {
    createBooking,
    makePayment
}
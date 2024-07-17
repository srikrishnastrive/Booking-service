const { BookingRepository } = require('../repositories');
const { ServerConfig } = require('../config');
const db = require('../models');
const AppError = require('../utils/errors/app-error');
const { Enums } = require('../utils/common');
const { BOOKED, CANCELLED } = Enums.BOOKING_STATUS;
const axios = require('axios');
const { StatusCodes } = require('http-status-codes');


const bookingRepository = new BookingRepository();

const FLIGHT_SERVICE_URL = `${ServerConfig.FLIGHT_SERVICE_URL}/api/v1`;

async function createBooking(data) {
    const transaction = await db.sequelize.transaction();
    try {
        const uri = `${FLIGHT_SERVICE_URL}/flights/${data.flightId}`;
        const flight = await axios.get(uri);
        const flightData = flight.data.SuccessResponse.data;

        if (data.noOfSeats > flightData.totalSeats) {
            throw new AppError("Not enough seats available", StatusCodes.BAD_REQUEST);
        }

        const totalBillingAmount = data.noOfSeats * flightData.price;
        const bookingPayload = { ...data, totalCost: totalBillingAmount };
        const booking = await bookingRepository.create(bookingPayload, transaction);
        const bookSeatsUri = `${FLIGHT_SERVICE_URL}/flights/${data.flightId}/seats`;
        await axios.patch(bookSeatsUri, { seats: data.noOfSeats });

        await transaction.commit();
        return booking;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

async function makePayment(data) {
    console.log(data);
    const transaction = await db.sequelize.transaction();
    try {
        const bookingDetails = await bookingRepository.get(data.bookingId, transaction);
        console.log(bookingDetails);
        if (bookingDetails.status === CANCELLED) {
            throw new AppError('The booking has expired', StatusCodes.BAD_REQUEST);
        }

        const bookingTime = new Date(bookingDetails.createdAt);
        const currentTime = new Date();

        if (currentTime - bookingTime > 300000) {
            await cancelBooking(data.bookingId);
            throw new AppError('The booking has expired', StatusCodes.BAD_REQUEST);
        }

        if(bookingDetails.totalCost != data.totalCost) {
            throw new AppError('The amount of the payment doesnt match', StatusCodes.BAD_REQUEST);
        }
        if(bookingDetails.userId != data.userId) {
            throw new AppError('The user corresponding to the booking doesnt match', StatusCodes.BAD_REQUEST);
        }

        await bookingRepository.update(data.bookingId, { status: BOOKED }, transaction);
        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

async function cancelBooking(bookingId) {
    const transaction = await db.sequelize.transaction();
    try {
        const bookingDetails = await bookingRepository.get(bookingId, transaction);

        if (bookingDetails.status === CANCELLED) {
            await transaction.commit();
            return true;
        }

        const bookSeatsUri = `${FLIGHT_SERVICE_URL}/flights/${bookingDetails.flightId}/seats`;
        await axios.patch(bookSeatsUri, { seats: bookingDetails.noOfSeats, dec: 0 });
        await bookingRepository.update(bookingId, { status: CANCELLED }, transaction);
        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

async function cancelOldBookings() {
    try {
        const currentTime = new Date(Date.now() - 1000 * 300);
        const response = await bookingRepository.cancelOldBookings(currentTime);
        return response;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

module.exports = {
    createBooking,
    makePayment,
    cancelBooking,
    cancelOldBookings
};

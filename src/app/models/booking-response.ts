export interface BookingResponse {
    bookingId: number;
    status: string;
    totalAmount: number;
    checkIn: string;
    checkOut: string;
    roomId: number;
    roomNumber: number;
    roomType: string;
    hotelName: string;
    paymentRequired?: boolean;
    additionalAmount?: number;
    checkoutUrl?: string;
}

export interface BookingRequest {
    userId: number;
    roomId: number;
    checkIn: string; // ISO format date string
    checkOut: string; // ISO format date string
}

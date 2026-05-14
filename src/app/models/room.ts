export interface Room {
    id: number;
    roomNumber: number;
    type: string;
    price: number;
    available: boolean;
    description?: string;
    hotelId: number;
}

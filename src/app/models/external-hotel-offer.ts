export interface ExternalHotelOffer {
  provider?: string;
  hotelId: string;
  name: string;
  cityCode: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  offerId?: string;
  checkInDate?: string;
  checkOutDate?: string;
  adults?: number;
  roomQuantity?: number;
  roomType?: string;
  description?: string;
  priceTotal?: string;
  currency?: string;
}

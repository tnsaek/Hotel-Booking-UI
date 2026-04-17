import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HotelService } from '../../../services/hotel-service';
import { Hotel } from '../../../models/hotel';
import { Room } from '../../../models/room';

@Component({
  selector: 'app-hotel-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './hotel-detail.html',
  styleUrls: ['./hotel-detail.scss'],
})
export class HotelDetail implements OnInit {

  private route = inject(ActivatedRoute);
  private hotelService = inject(HotelService);

  hotel!: Hotel;
  rooms: Room[] = [];

  ngOnInit(): void {
    const hotelId = Number(this.route.snapshot.paramMap.get('id'));
    this.hotelService.getHotelById(hotelId).subscribe((hotel) => {
      this.hotel = hotel;
    });
    this.hotelService.getRoomsByHotel(hotelId).subscribe((rooms) => {
      this.rooms = rooms;
    });
  }
}

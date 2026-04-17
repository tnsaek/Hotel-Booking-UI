import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HotelService } from '../../../services/hotel-service';
import { Hotel } from '../../../models/hotel';

@Component({
  selector: 'app-hotel-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './hotel-list.html',
  styleUrl: './hotel-list.scss',
})
export class HotelList implements OnInit {

  hotels: Hotel[] = [];

  constructor(private hotelService: HotelService) {}

  ngOnInit(): void {
    this.hotelService.getHotels().subscribe((hotels) => {
      this.hotels = hotels;
    });
  }
}

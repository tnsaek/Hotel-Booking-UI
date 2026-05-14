import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Hotel } from '../../../models/hotel';
import { Room } from '../../../models/room';
import { HotelDetailData } from '../../../resolvers/hotel-detail-resolver';

@Component({
  selector: 'app-hotel-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './hotel-detail.html',
  styleUrls: ['./hotel-detail.scss'],
})
export class HotelDetail implements OnInit {

  private route = inject(ActivatedRoute);
  hotel: Hotel | null = null;
  availableRooms: Room[] = [];
  errorMessage = '';

  ngOnInit(): void {
    this.route.data.subscribe((data) => {
      const detail = data['detail'] as HotelDetailData;
      this.hotel = detail?.hotel ?? null;
      this.availableRooms = (detail?.rooms ?? []).filter((room) => room.available);
      this.errorMessage = this.hotel ? '' : 'Failed to load hotel details.';
    });
  }
}

import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Hotel } from '../../../models/hotel';

@Component({
  selector: 'app-hotel-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './hotel-list.html',
  styleUrl: './hotel-list.scss',
})
export class HotelList implements OnInit {
  private route = inject(ActivatedRoute);

  hotels: Hotel[] = [];
  isLoading = true;
  errorMessage = '';

  ngOnInit(): void {
    this.route.data.subscribe((data) => {
      this.hotels = (data['hotels'] as Hotel[]) ?? [];
      this.isLoading = false;
    });
  }
}

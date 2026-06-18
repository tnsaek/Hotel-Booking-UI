import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from './shared/footer/footer';
import { Navbar } from './shared/navbar/navbar';
import { Chatbot } from './shared/chatbot/chatbot';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer, Chatbot],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App {
  protected readonly title = signal('hotel-booking-ui');
}

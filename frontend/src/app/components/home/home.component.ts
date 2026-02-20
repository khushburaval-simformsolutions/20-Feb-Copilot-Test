import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styles: [`
    .home-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }

    h1 {
      color: #333;
      margin-bottom: 1rem;
    }

    .navigation-section {
      margin-top: 2rem;
      padding: 1.5rem;
      background-color: #f5f5f5;
      border-radius: 8px;
    }

    .navigation-section h2 {
      color: #555;
      margin-bottom: 1rem;
    }

    .nav-links {
      list-style: none;
      padding: 0;
    }

    .nav-links li {
      margin-bottom: 1rem;
    }

    .nav-link {
      display: block;
      padding: 1rem;
      background-color: white;
      border: 2px solid #ddd;
      border-radius: 6px;
      text-decoration: none;
      color: #333;
      transition: all 0.3s ease;
    }

    .nav-link:hover {
      border-color: #007bff;
      box-shadow: 0 2px 8px rgba(0, 123, 255, 0.2);
      transform: translateY(-2px);
    }

    .nav-link strong {
      display: block;
      font-size: 1.2rem;
      color: #007bff;
      margin-bottom: 0.5rem;
    }

    .nav-link span {
      display: block;
      font-size: 0.9rem;
      color: #666;
    }
  `]
})
export class HomeComponent {
}

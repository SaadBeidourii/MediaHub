import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'MediaHub';
  isDarkMode = true; // Start with dark mode by default

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    document.body.classList.toggle('light-mode', !this.isDarkMode);
    // Store preference in localStorage if needed
    localStorage.setItem('darkMode', this.isDarkMode ? 'true' : 'false');
  }
}

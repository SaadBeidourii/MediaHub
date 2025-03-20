import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
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
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);

    // Initialize theme from localStorage if in browser
    if (this.isBrowser) {
      const savedTheme = localStorage.getItem('darkMode');
      if (savedTheme !== null) {
        this.isDarkMode = savedTheme === 'true';
        document.body.classList.toggle('light-mode', !this.isDarkMode);
      }
    }
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    document.body.classList.toggle('light-mode', !this.isDarkMode);

    // Only store preference in localStorage if in browser
    if (this.isBrowser) {
      localStorage.setItem('darkMode', this.isDarkMode ? 'true' : 'false');
    }
  }
}

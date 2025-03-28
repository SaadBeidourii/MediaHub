import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Asset } from '../models/asset.model';
import { AssetService } from '../services/asset.service';

// Import ePub (this will be properly initialized in the component)
declare const ePub: any;

@Component({
  selector: 'app-epub-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './epub-viewer.component.html',
  styleUrls: ['./epub-viewer.component.scss']
})
export class EpubViewerComponent implements OnInit, OnDestroy {
  @ViewChild('epubContainer') epubContainer!: ElementRef;
  @Input() asset!: Asset;
  @Output() close = new EventEmitter<void>();
  @Output() download = new EventEmitter<Asset>();

  book: any;
  rendition: any;
  displayed: any;
  isLoading = true;
  loadError = false;
  errorMessage = '';
  
  // Navigation state
  currentCfi: string = '';
  currentPage: number = 0;
  totalPages: number = 0;
  progress: number = 0;
  
  // Book metadata
  bookTitle: string = '';
  bookAuthor: string = '';
  
  // Table of contents
  toc: any[] = [];
  currentChapter: string = '';
  showToc = false;
  
  // Display settings
  fontSize: number = 100; // Percentage
  epubUrl: string | null = null;

  constructor(private assetService: AssetService) {}

  ngOnInit(): void {
    console.log('EPUB Viewer initialized with asset:', this.asset);
    // Set the title immediately so something shows while loading
    this.bookTitle = this.asset.name;
    
    // Load script dynamically to ensure it's available
    this.loadEpubJsScript().then(() => {
      this.loadEpub();
    }).catch(error => {
      console.error('Failed to initialize EPUB.js:', error);
      this.handleError('Failed to load EPUB reader library');
    });
  }

  ngOnDestroy(): void {
    // Clean up resources
    if (this.book) {
      this.book.destroy();
    }
    
    if (this.epubUrl) {
      URL.revokeObjectURL(this.epubUrl);
    }
  }

  loadEpubJsScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      // If EPUB.js is already loaded, resolve immediately
      if (typeof ePub !== 'undefined') {
        console.log('EPUB.js already loaded');
        resolve();
        return;
      }

      console.log('Attempting to load EPUB.js script');
      const script = document.createElement('script');
      script.type = 'text/javascript';
      // Try a different CDN that's more reliable
      script.src = 'https://cdn.jsdelivr.net/npm/epubjs/dist/epub.min.js';
      script.onload = () => {
        console.log('EPUB.js script loaded successfully');
        resolve();
      };
      script.onerror = (error) => {
        console.error('Failed to load EPUB.js script:', error);
        // Attempt fallback
        const fallbackScript = document.createElement('script');
        fallbackScript.type = 'text/javascript';
        fallbackScript.src = 'https://unpkg.com/epubjs/dist/epub.min.js';
        fallbackScript.onload = () => {
          console.log('EPUB.js script loaded from fallback');
          resolve();
        };
        fallbackScript.onerror = (fallbackError) => {
          console.error('Failed to load EPUB.js from fallback:', fallbackError);
          reject(new Error('Failed to load EPUB.js library'));
        };
        document.head.appendChild(fallbackScript);
      };
      document.head.appendChild(script);
    });
  }

  loadEpub(): void {
    this.isLoading = true;
    console.log('Loading EPUB file:', this.asset.id);
    
    this.assetService.downloadAsset(this.asset.id).subscribe({
      next: (blob: Blob) => {
        console.log('EPUB file downloaded successfully:', blob.size, 'bytes');
        // Create a URL for the blob
        this.epubUrl = URL.createObjectURL(blob);
        console.log('EPUB URL created:', this.epubUrl);
        
        // Initialize the EPUB reader once the component is ready
        setTimeout(() => this.initializeReader(), 100);
      },
      error: (error) => {
        console.error('Error loading EPUB file:', error);
        this.handleError('Failed to download EPUB file');
      }
    });
  }

  initializeReader(): void {
    if (!this.epubUrl) {
      this.handleError('EPUB URL not available');
      return;
    }
    
    if (!this.epubContainer || !this.epubContainer.nativeElement) {
      this.handleError('EPUB container not available');
      return;
    }
    
    // Check if EPUB.js is loaded
    if (typeof ePub === 'undefined') {
      this.handleError('EPUB.js library not loaded');
      return;
    }

    try {
      console.log('Initializing EPUB reader with URL:', this.epubUrl);
      
      // Create the book
      this.book = ePub(this.epubUrl);
      console.log('EPUB book object created:', this.book);

      // Get the book metadata
      this.book.loaded.metadata
        .then((metadata: any) => {
          console.log('EPUB metadata loaded:', metadata);
          this.bookTitle = metadata.title || this.asset.name;
          this.bookAuthor = metadata.creator || 'Unknown Author';
        })
        .catch((error: any) => {
          console.warn('Failed to load EPUB metadata:', error);
          // Continue anyway, using filename as title
          this.bookTitle = this.asset.name;
        });

      // Get the book navigation (table of contents)
      this.book.loaded.navigation
        .then((nav: any) => {
          console.log('EPUB navigation loaded:', nav);
          this.toc = nav.toc;
        })
        .catch((error: any) => {
          console.warn('Failed to load EPUB navigation:', error);
          this.toc = [];
        });

      console.log('Creating EPUB rendition');
      // Create a rendition
      this.rendition = this.book.renderTo(this.epubContainer.nativeElement, {
        width: '100%',
        height: '100%',
        spread: 'none'
      });

      console.log('Displaying EPUB content');
      // Display the book
      this.displayed = this.rendition.display()
        .then(() => {
          console.log('EPUB content displayed successfully');
          this.isLoading = false;
        })
        .catch((error: any) => {
          console.error('Failed to display EPUB content:', error);
          this.handleError('Failed to render EPUB content');
        });

      // Track current location
      this.rendition.on('relocated', (location: any) => {
        console.log('EPUB location updated:', location);
        this.currentCfi = location.start.cfi;
        this.currentPage = location.start.displayed.page;
        this.totalPages = location.start.displayed.total;
        this.progress = Math.floor((this.currentPage / this.totalPages) * 100) || 0;
        
        // Save current location to localStorage
        localStorage.setItem(`epub-location-${this.asset.id}`, this.currentCfi);
        
        // Get current chapter
        if (this.toc && this.toc.length > 0) {
          const chapter = this.findCurrentChapter(this.currentCfi);
          if (chapter) {
            this.currentChapter = chapter.label;
          }
        }
      });

      // Load saved position if available
      const savedCfi = localStorage.getItem(`epub-location-${this.asset.id}`);
      if (savedCfi) {
        console.log('Loading saved EPUB position:', savedCfi);
        this.rendition.display(savedCfi).catch((error: any) => {
          console.warn('Failed to restore saved position:', error);
          // Continue from the beginning
          this.rendition.display();
        });
      }

      // Add keyboard navigation
      this.addKeyboardNavigation();
      
    } catch (error) {
      console.error('Error initializing EPUB reader:', error);
      this.handleError('Failed to initialize EPUB reader');
    }
  }

  // Handle errors
  handleError(message: string): void {
    console.error('EPUB viewer error:', message);
    this.errorMessage = message;
    this.loadError = true;
    this.isLoading = false;
  }

  // Navigation methods
  nextPage(): void {
    if (this.rendition) {
      this.rendition.next();
    }
  }

  prevPage(): void {
    if (this.rendition) {
      this.rendition.prev();
    }
  }

  navigateToChapter(href: string): void {
    if (this.rendition) {
      this.rendition.display(href);
      this.showToc = false;
    }
  }

  // Font size controls
  increaseFontSize(): void {
    this.fontSize += 10;
    this.applyFontSize();
  }

  decreaseFontSize(): void {
    if (this.fontSize > 70) {
      this.fontSize -= 10;
      this.applyFontSize();
    }
  }

  applyFontSize(): void {
    if (this.rendition) {
      this.rendition.themes.fontSize(`${this.fontSize}%`);
    }
  }

  // Find the current chapter based on the CFI
  findCurrentChapter(cfi: string): any {
    if (!this.toc || !this.book) return null;
    
    let currentChapter = null;
    let lastCompare = -1;

    for (const chapter of this.toc) {
      if (chapter.href) {
        try {
          const chapterCfi = this.book.spine.get(chapter.href).cfiFromHref(chapter.href);
          const compare = this.book.compareCFIs(chapterCfi, cfi);
          
          if (compare > 0 && (lastCompare === -1 || compare < lastCompare)) {
            currentChapter = chapter;
            lastCompare = compare;
          }
        } catch (error) {
          console.warn('Error finding chapter:', error);
        }
      }
    }

    return currentChapter;
  }

  toggleToc(): void {
    this.showToc = !this.showToc;
  }

  onClose(): void {
    this.close.emit();
  }
  
  onDownload(): void {
    this.download.emit(this.asset);
  }

  // Add keyboard navigation
  addKeyboardNavigation(): void {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!this.rendition) return;
      
      // Left arrow key => previous page
      if (e.key === 'ArrowLeft') {
        this.prevPage();
        e.preventDefault();
      }
      
      // Right arrow key => next page
      if (e.key === 'ArrowRight') {
        this.nextPage();
        e.preventDefault();
      }
      
      // Escape key => close viewer
      if (e.key === 'Escape') {
        this.onClose();
        e.preventDefault();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    // Cleanup on component destroy
    this.rendition.once('removed', () => {
      document.removeEventListener('keydown', handleKeyDown);
    });
  }
}
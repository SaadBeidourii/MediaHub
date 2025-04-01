// audio-player.component.ts
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Asset } from '../models/asset.model';
import { AssetService } from '../services/asset.service';

// Debug flag - set to true to see detailed logs
const DEBUG = true;

// Debug logging function
function debugLog(...args: any[]): void {
  if (DEBUG) {
    console.log('[AudioPlayer]', ...args);
  }
}

@Component({
  selector: 'app-audio-player',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audio-player.component.html',
  styleUrls: ['./audio-player.component.scss']
})
export class AudioPlayerComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('audioElement') audioElement!: ElementRef<HTMLAudioElement>;
  @Input() asset!: Asset;
  @Output() close = new EventEmitter<void>();
  @Output() download = new EventEmitter<Asset>();

  // Audio state
  isPlaying = false;
  isLoading = true;
  loadError = false;
  errorMessage = '';
  duration = 0;
  currentTime = 0;
  volume = 1;
  isMuted = false;
  audioUrl: string | null = null;
  
  // Flag to know when blob is downloaded
  audioBlob: Blob | null = null;
  audioReady = false;

  // Display info
  currentTimeFormatted: string = '0:00';
  durationFormatted: string = '0:00';

  constructor(private assetService: AssetService) {}

  ngOnInit(): void {
    debugLog('Initializing audio player with asset:', this.asset);
    this.loadAudio();
  }
  
  ngAfterViewInit(): void {
    // ViewChild elements are now available
    debugLog('ngAfterViewInit called, audioElement available:', !!this.audioElement);
    
    // Add a short delay to ensure DOM is completely rendered
    setTimeout(() => {
      debugLog('Checking audio element after timeout:', !!this.audioElement);
      if (this.audioBlob) {
        debugLog('Blob already downloaded, setting up audio in ngAfterViewInit');
        this.setupAudio();
      }
    }, 100);
  }

  loadAudio(): void {
    this.isLoading = true;
    this.loadError = false;
    debugLog('Loading audio file:', this.asset.id);
    
    this.assetService.downloadAsset(this.asset.id).subscribe({
      next: (blob: Blob) => {
        debugLog('Audio file downloaded successfully:', blob.size, 'bytes', 'MIME type:', blob.type);
        this.audioBlob = blob;
        
        // If view is already initialized, set up the audio
        if (this.audioElement) {
          debugLog('Audio element already available, setting up audio');
          this.setupAudio();
        } else {
          debugLog('Audio element not yet available, will set up in AfterViewInit');
        }
      },
      error: (error) => {
        console.error('Error loading audio file:', error);
        debugLog('Error loading audio file:', error);
        this.handleError('Failed to download audio file');
      }
    });
  }

  setupAudio(): void {
    if (!this.audioBlob) {
      debugLog('Cannot set up audio: Audio blob not available');
      this.handleError('Audio data not available');
      return;
    }

    // Double check the audio element
    if (!this.audioElement) {
      debugLog('Audio element not found, creating one programmatically');
      
      // Create an audio element programmatically if the ViewChild isn't working
      const tempAudio = document.createElement('audio');
      tempAudio.controls = false;
      tempAudio.preload = 'auto';
      
      // Use this element instead
      this.audioElement = {
        nativeElement: tempAudio
      } as ElementRef<HTMLAudioElement>;
    }

    debugLog('Setting up audio with blob:', {
      type: this.audioBlob.type,
      size: this.audioBlob.size
    });
    
    // Create blob URL with explicit content type
    const contentType = this.audioBlob.type || 'audio/mpeg';
    debugLog('Using content type:', contentType);
    
    const blob = new Blob([this.audioBlob], { type: contentType });
    this.audioUrl = URL.createObjectURL(blob);
    
    debugLog('Created audio URL:', this.audioUrl);
    
    const audio = this.audioElement.nativeElement;
    audio.src = this.audioUrl;
    debugLog('Set audio src to:', audio.src);
    
    // Set up event listeners
    audio.addEventListener('loadedmetadata', () => {
      debugLog('Audio metadata loaded, duration:', audio.duration);
      this.duration = audio.duration;
      this.durationFormatted = this.formatTime(this.duration);
      this.isLoading = false;
      this.audioReady = true;
    });
    
    audio.addEventListener('canplay', () => {
      debugLog('Audio can play now!');
      this.isLoading = false;
      this.audioReady = true;
    });
    
    audio.addEventListener('loadeddata', () => {
      debugLog('Audio data loaded');
      // Force loading to false when data is loaded
      this.isLoading = false;
      this.audioReady = true;
    });
    
    audio.addEventListener('timeupdate', () => {
      this.currentTime = audio.currentTime;
      this.currentTimeFormatted = this.formatTime(this.currentTime);
    });
    
    audio.addEventListener('ended', () => {
      debugLog('Audio playback ended');
      this.isPlaying = false;
    });
    
    audio.addEventListener('error', (e) => {
      console.error('Audio element error:', e);
      debugLog('Audio error event:', e);
      debugLog('Audio error code:', audio.error?.code);
      debugLog('Audio error message:', audio.error?.message);
      debugLog('Audio network state:', audio.networkState);
      debugLog('Audio ready state:', audio.readyState);
      this.handleError(`Error playing audio file: ${audio.error?.message || 'Unknown error'} (code: ${audio.error?.code})`);
    });
    
    // Start loading the audio
    debugLog('Starting audio load');
    audio.load();
    
    // Try preload
    audio.preload = 'auto';
    
    // Check readyState after a short delay
    setTimeout(() => {
      debugLog('Audio ready state after 1s:', audio.readyState);
      debugLog('Audio network state after 1s:', audio.networkState);
      
      // If still loading after a short time, force the ready state
      if (this.isLoading) {
        setTimeout(() => {
          if (this.isLoading) {
            this.forceReadyState();
          }
        }, 2000);
      }
    }, 1000);
  }

  forceReadyState(): void {
    debugLog('Forcing ready state due to timeout');
    this.isLoading = false;
    this.audioReady = true;
  }

  togglePlayPause(): void {
    if (!this.audioReady) {
      debugLog('Cannot toggle play: Audio not ready');
      return;
    }
    
    const audio = this.audioElement.nativeElement;
    
    if (this.isPlaying) {
      debugLog('Pausing audio');
      audio.pause();
    } else {
      debugLog('Playing audio');
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
        debugLog('Error playing audio:', error);
        this.handleError('Failed to play audio file: ' + (error.message || 'Unknown error'));
      });
    }
    
    this.isPlaying = !this.isPlaying;
  }

  seek(event: MouseEvent): void {
    if (!this.audioReady) return;
    
    const audio = this.audioElement.nativeElement;
    const progressBar = event.currentTarget as HTMLElement;
    const rect = progressBar.getBoundingClientRect();
    const percentage = (event.clientX - rect.left) / rect.width;
    
    const seekTime = percentage * this.duration;
    debugLog('Seeking to time:', seekTime);
    
    audio.currentTime = seekTime;
  }

  setVolume(event: Event): void {
    if (!this.audioReady) return;
    
    const input = event.target as HTMLInputElement;
    this.volume = Number(input.value);
    this.audioElement.nativeElement.volume = this.volume;
    debugLog('Volume set to:', this.volume);
    
    // Update muted state based on volume
    this.isMuted = this.volume === 0;
  }

  toggleMute(): void {
    if (!this.audioReady) return;
    
    const audio = this.audioElement.nativeElement;
    
    if (this.isMuted) {
      // Unmute
      debugLog('Unmuting audio');
      audio.volume = this.volume || 0.5;
      this.isMuted = false;
    } else {
      // Mute
      debugLog('Muting audio');
      audio.volume = 0;
      this.isMuted = true;
    }
  }

  formatTime(seconds: number): string {
    if (isNaN(seconds)) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  handleError(message: string): void {
    console.error('Audio player error:', message);
    debugLog('Error:', message);
    this.errorMessage = message;
    this.loadError = true;
    this.isLoading = false;
  }

  onClose(): void {
    debugLog('Closing audio player');
    this.cleanupAudio();
    this.close.emit();
  }
  
  onDownload(): void {
    debugLog('Downloading audio file');
    this.download.emit(this.asset);
  }
  
  cleanupAudio(): void {
    debugLog('Cleaning up audio resources');
    // Stop any ongoing audio
    if (this.audioElement) {
      const audio = this.audioElement.nativeElement;
      audio.pause();
      audio.src = '';
      debugLog('Audio playback stopped');
    }
    
    // Revoke object URL to prevent memory leaks
    if (this.audioUrl) {
      debugLog('Revoking URL:', this.audioUrl);
      URL.revokeObjectURL(this.audioUrl);
      this.audioUrl = null;
    }
    
    this.audioBlob = null;
    this.audioReady = false;
  }
  
  ngOnDestroy(): void {
    debugLog('Component destroyed, cleaning up');
    this.cleanupAudio();
  }
}
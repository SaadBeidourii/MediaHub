import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef
} from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { AssetService } from '../../services/asset.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-audio-player',
  templateUrl: './audio-player.component.html',
  imports: [
    CommonModule,   
  ],
  styleUrls: ['./audio-player.component.scss']
})
export class AudioPlayerComponent implements OnInit, OnDestroy {
  @Input() assetId!: string;        
  @Input() filename?: string;       
  @Output() closePlayer = new EventEmitter<void>();

  @ViewChild('audioRef', { static: true })
  private audioRef!: ElementRef<HTMLAudioElement>;

  audioUrl?: SafeUrl;
  private objectUrl?: string;

  // playback state
  isPlaying = false;
  currentTime = 0;
  duration = 0;

  constructor(
    private assetService: AssetService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    // fetch the blob, create a URL, sanitize it
    this.assetService.downloadAsset(this.assetId).subscribe(blob => {
      this.objectUrl = URL.createObjectURL(blob);
      this.audioUrl = this.sanitizer.bypassSecurityTrustUrl(this.objectUrl);
    });
  }

  ngOnDestroy() {
    // clean up
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
    }
  }

  // once metadata is loaded we know duration
  onLoaded() {
    const audio = this.audioRef.nativeElement;
    this.duration = audio.duration;
    this.isPlaying = !audio.paused;
  }

  // update currentTime as the audio plays
  onTimeUpdate() {
    this.currentTime = this.audioRef.nativeElement.currentTime;
  }

  // user clicked the progress bar: calculate and seek
  seek(event: MouseEvent) {
    const bar = (event.target as HTMLElement).getBoundingClientRect();
    const clickX = event.clientX - bar.left;
    const pct = clickX / bar.width;
    this.audioRef.nativeElement.currentTime = pct * this.duration;
  }

  // toggle between play and pause
  togglePlay() {
    const audio = this.audioRef.nativeElement;
    if (audio.paused) {
      audio.play();
      this.isPlaying = true;
    } else {
      audio.pause();
      this.isPlaying = false;
    }
  }

  // format seconds -> mm:ss
  formatTime(sec: number): string {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0');
    const s = Math.floor(sec % 60)
      .toString()
      .padStart(2, '0');
    return `${m}:${s}`;
  }

  // notify parent to close the modal
  close() {
    this.closePlayer.emit();
  }

  // if the track ends, reset play state
  onEnded() {
    this.isPlaying = false;
    this.currentTime = 0;
  }
}

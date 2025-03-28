// frontend/src/app/shared/file-card/file-card.component.ts
import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Asset } from '../../models/asset.model';
import { AssetService } from '../../services/asset.service';

@Component({
  selector: 'app-file-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './file-card.component.html',
  styleUrls: ['./file-card.component.scss']
})
export class FileCardComponent {
  private assetService = inject(AssetService);

  @Input() asset!: Asset;

  @Output() view = new EventEmitter<Asset>();
  @Output() download = new EventEmitter<Asset>();
  @Output() delete = new EventEmitter<Asset>();
  @Output() move = new EventEmitter<Asset>();

  get formattedSize(): string {
    return this.assetService.formatFileSize(this.asset.size);
  }

  onView(): void {
    this.view.emit(this.asset);
  }

  onDownload(): void {
    this.download.emit(this.asset);
  }

  onDelete(): void {
    this.delete.emit(this.asset);
  }

  onMove(): void {
    this.move.emit(this.asset);
  }
}
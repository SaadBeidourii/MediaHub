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

  // Asset type enum for use in the template
  readonly AssetType = {
    PDF: 'pdf',
    EPUB: 'epub'
  };

  get formattedSize(): string {
    return this.assetService.formatFileSize(this.asset.size);
  }

  get fileIcon(): string {
    switch (this.asset.type.toLowerCase()) {
      case this.AssetType.PDF:
        return 'pdf-icon';
      case this.AssetType.EPUB:
        return 'epub-icon';
      default:
        return 'document-icon';
    }
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
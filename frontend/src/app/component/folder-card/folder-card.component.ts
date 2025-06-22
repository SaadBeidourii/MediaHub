// frontend/src/app/shared/folder-card/folder-card.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Folder } from '../../models/folder.model';

@Component({
  selector: 'app-folder-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './folder-card.component.html',
  styleUrls: ['./folder-card.component.scss']
})
export class FolderCardComponent {
  @Input() folder!: Folder;

  @Output() navigate = new EventEmitter<string>();
  @Output() delete = new EventEmitter<Folder>();
  @Output() move = new EventEmitter<Folder>();

  onNavigate(): void {
    this.navigate.emit(this.folder.id);
  }

  onDelete(event: Event): void {
    event.stopPropagation();
    this.delete.emit(this.folder);
  }

  onMove(event: Event): void {
    event.stopPropagation();
    this.move.emit(this.folder);
  }
}
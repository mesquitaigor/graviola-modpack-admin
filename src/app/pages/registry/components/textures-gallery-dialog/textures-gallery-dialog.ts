import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import ItemTextureModel from '../../../../models/item-texture/item-texture.model';

@Component({
  selector: 'app-textures-gallery-dialog',
  standalone: true,
  imports: [DialogModule],
  templateUrl: './textures-gallery-dialog.html',
})
export class TexturesGalleryDialogComponent {
  @Input() visible = false;
  @Input() textures: ItemTextureModel[] = [];
  @Input() textureSrc: (texture: ItemTextureModel) => string | undefined = () =>
    undefined;

  @Output() visibleChange = new EventEmitter<boolean>();
}

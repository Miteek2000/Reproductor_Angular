import { Component, Input, Output, EventEmitter } from '@angular/core';

import { Track } from '../../models/track.model';

@Component({
    selector: 'app-playlist',
    imports: [],
    templateUrl: './playlist.component.html',
    styleUrls: ['./playlist.component.css']
})
export class PlaylistComponent {
  @Input() playlist: Track[] = [];
  @Input() currentTrackId: string | null | undefined = undefined;
  @Output() select = new EventEmitter<Track>();
  @Output() remove = new EventEmitter<string>();

  onSelect(track: Track) {
    this.select.emit(track);
  }

  onRemove(id: string, e: Event) {
    e.stopPropagation();
    this.remove.emit(id);
  }

  getArtistNames(track: Track): string {
    if (!track || !track.artists) return '';
    return track.artists.map(a => a.name).join(', ');
  }

  getAlbumImage(track: Track): string {
    return (track && track.album && track.album.images && track.album.images.length > 0)
      ? track.album.images[0].url
      : 'https://via.placeholder.com/300';
  }
}

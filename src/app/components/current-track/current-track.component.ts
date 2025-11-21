import { Component, Input } from '@angular/core';

import { Track } from '../../models/track.model';

@Component({
    selector: 'app-current-track',
    imports: [],
    templateUrl: './current-track.component.html',
    styleUrls: ['./current-track.component.css']
})
export class CurrentTrackComponent {
  @Input() track: Track | null = null;

  getArtistNames(track: Track | null): string {
    if (!track || !track.artists) return '';
    return track.artists.map(a => a.name).join(', ');
  }

  getAlbumImage(track: Track | null): string {
    return (track && track.album && track.album.images && track.album.images.length > 0)
      ? track.album.images[0].url
      : 'https://via.placeholder.com/300';
  }
}

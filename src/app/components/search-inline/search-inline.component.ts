import { Component, Input, Output, EventEmitter } from '@angular/core';

import { Track, AlbumItem, ArtistItem } from '../../models/track.model';

@Component({
    selector: 'app-search-inline',
    imports: [],
    templateUrl: './search-inline.component.html',
    styleUrls: ['./search-inline.component.css']
})
export class SearchInlineComponent {
  @Input() isLoading: boolean = false;
  @Input() searchTracks: Track[] = [];
  @Input() searchAlbums: AlbumItem[] = [];
  @Input() searchArtists: ArtistItem[] = [];

  @Output() playTrack = new EventEmitter<Track>();
  @Output() selectAlbum = new EventEmitter<AlbumItem>();
  @Output() selectArtist = new EventEmitter<ArtistItem>();
  @Output() openDetail = new EventEmitter<{ type: 'track' | 'album' | 'artist'; item: Track | AlbumItem | ArtistItem }>();
  @Output() close = new EventEmitter<void>();

  onPlay(track: Track, e?: Event) {
    e?.stopPropagation();
    this.playTrack.emit(track);
  }

  onSelectAlbum(album: AlbumItem) {
    this.selectAlbum.emit(album);
  }

  onSelectArtist(artist: ArtistItem) {
    this.selectArtist.emit(artist);
  }

  onOpenDetail(type: 'track' | 'album' | 'artist', item: Track | AlbumItem | ArtistItem) {
    console.log('[search-inline] openDetail', type, item?.id || item);
    this.openDetail.emit({ type, item });
  }

  onClose() {
    this.close.emit();
  }

  getArtistNames(track: Track): string {
    if (!track || !track.artists) return '';
    return track.artists.map(a => a.name).join(', ');
  }

  getAlbumImageForTrack(track: Track): string {
    return (track && track.album && track.album.images && track.album.images.length > 0)
      ? track.album.images[0].url
      : 'https://via.placeholder.com/300';
  }

  getArtistImage(artist: ArtistItem): string {
    // Algunos ArtistItem pueden tener images, otros no
    // @ts-ignore
    const imgs = (artist as any)?.images || [];
    return (imgs && imgs.length > 0) ? imgs[0].url : 'https://via.placeholder.com/300';
  }
}

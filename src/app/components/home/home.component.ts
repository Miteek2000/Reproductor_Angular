import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SpotifyService } from '../../services/spotify.service';
import { Track, AlbumItem, ArtistItem } from '../../models/track.model';
import { CurrentTrackComponent } from '../current-track/current-track.component';
import { SearchInlineComponent } from '../search-inline/search-inline.component';
import { PlaylistComponent } from '../playlist/playlist.component';

@Component({
    selector: 'app-home',
    imports: [CommonModule, FormsModule, CurrentTrackComponent, SearchInlineComponent, PlaylistComponent],
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, AfterViewInit {
  currentTrack: Track | null = null;
  playlist: Track[] = [];
  // Search-related
  searchQuery: string = '';
  isLoading: boolean = false;
  hasSearched: boolean = false;
  apiConnected: boolean = false;
  errorMessage: string = '';

  searchTracks: Track[] = [];
  searchAlbums: AlbumItem[] = [];
  searchArtists: ArtistItem[] = [];

  constructor(private spotifyService: SpotifyService) {}

  ngOnInit(): void {
    this.spotifyService.currentTrack$.subscribe(track => {
      this.currentTrack = track;
    });

    this.spotifyService.playlist$.subscribe(playlist => {
      this.playlist = playlist;
    });
  }

  removeFromPlaylist(trackId: string): void {
    this.spotifyService.removeFromPlaylist(trackId);
  }

  selectTrack(track: Track): void {
    this.spotifyService.setCurrentTrack(track);
  }

  getArtistNames(track: Track): string {
    return track.artists.map(artist => artist.name).join(', ');
  }

  getAlbumImage(track: Track): string {
    return track.album.images[0]?.url || 'https://via.placeholder.com/300';
  }

  // Search methods integrated into home view
  ngAfterViewInit(): void {
    this.apiConnected = this.spotifyService.isReady();
  }

  onSearch(): void {
    this.errorMessage = '';
    if (!this.searchQuery || this.searchQuery.trim().length === 0) {
      this.errorMessage = 'Escribe algo para buscar.';
      return;
    }

    this.isLoading = true;
    this.hasSearched = false;

    this.spotifyService.searchAll(this.searchQuery.trim()).subscribe({
      next: (res) => {
        this.searchTracks = res.tracks || [];
        this.searchAlbums = res.albums || [];
        this.searchArtists = res.artists || [];
        this.hasSearched = true;
        this.isLoading = false;
        this.apiConnected = true;
      },
      error: (err) => {
        console.error('Search error', err);
        this.isLoading = false;
        this.hasSearched = true;
        this.apiConnected = this.spotifyService.isReady();
        if (err && err.status === 401) {
          this.errorMessage = 'Token expirado o no autorizado. Intenta recargar.';
        } else if (err && err.status === 429) {
          this.errorMessage = 'Límite de peticiones alcanzado. Intenta más tarde.';
        } else {
          this.errorMessage = 'Error al buscar. Revisa tu conexión.';
        }
      }
    });
  }

  selectTrackFromSearch(track: Track): void {
    this.spotifyService.setCurrentTrack(track);
    // volver a la vista normal: ocultar resultados
    this.hasSearched = false;
    this.searchQuery = '';
    this.searchTracks = [];
  }

  // Handle clicking an album in search results: navigate to album's first track or open album view
  selectAlbum(album: any): void {
    if (!album || !album.id) return;

    this.isLoading = true;
    this.spotifyService.getAlbumTracks(album.id).subscribe({
      next: (tracks) => {
        this.isLoading = false;
        if (!tracks || tracks.length === 0) return;

        // Add all tracks to playlist and set first as current
        tracks.forEach((t, idx) => {
          if (idx === 0) {
            this.spotifyService.setCurrentTrack(t);
          } else {
            this.spotifyService.addToPlaylist(t);
          }
        });

        // Close search overlay
        this.hasSearched = false;
        this.searchQuery = '';
        this.searchTracks = [];
        this.searchAlbums = [];
        this.searchArtists = [];
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error loading album tracks', err);
      }
    });
  }

  prevTrack(): void {
    if (!this.currentTrack) return;
    const idx = this.playlist.findIndex(t => t.id === this.currentTrack!.id);
    if (idx > 0) {
      const prev = this.playlist[idx - 1];
      this.spotifyService.setCurrentTrack(prev);
    }
  }

  nextTrack(): void {
    if (!this.currentTrack) return;
    const idx = this.playlist.findIndex(t => t.id === this.currentTrack!.id);
    if (idx >= 0 && idx < this.playlist.length - 1) {
      const next = this.playlist[idx + 1];
      this.spotifyService.setCurrentTrack(next);
    }
  }
}

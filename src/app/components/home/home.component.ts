import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SpotifyService } from '../../services/spotify.service';
import { Track } from '../../models/track.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  currentTrack: Track | null = null;
  playlist: Track[] = [];
  private isPlaying = false;

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

  next(): void {
    this.spotifyService.nextTrack();
  }

  prev(): void {
    this.spotifyService.prevTrack();
  }

  togglePlay(): void {
    // Esta app no reproduce audio nativo; togglePlay solo alterna el estado interno
    // y si no hay pista seleccionada, selecciona la primera de la playlist.
    if (!this.currentTrack && this.playlist.length > 0) {
      this.spotifyService.setCurrentTrack(this.playlist[0]);
      this.isPlaying = true;
      return;
    }

    this.isPlaying = !this.isPlaying;
    // Puedes usar isPlaying para cambiar el icono en la UI si quieres.
  }
}

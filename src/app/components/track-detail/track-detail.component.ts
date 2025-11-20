import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SpotifyService } from '../../services/spotify.service';
import { Track } from '../../models/track.model';

@Component({
  selector: 'app-track-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './track-detail.component.html',
  styleUrl: './track-detail.component.css'
})
export class TrackDetailComponent implements OnInit {
  @Input() track: Track | null = null;
  @Input() compact: boolean = false;
  @Output() selected: EventEmitter<Track> = new EventEmitter();
  isLoading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private spotifyService: SpotifyService
  ) {}

  ngOnInit(): void {
    // If `track` is provided as an input (embedded mode), don't load via route
    if (this.track) {
      this.isLoading = false;
      return;
    }

    this.route.params.subscribe(params => {
      const trackId = params['id'];
      if (trackId) {
        this.loadTrack(trackId);
      }
    });
  }

  loadTrack(id: string): void {
    this.isLoading = true;
    this.spotifyService.getTrack(id).subscribe({
      next: (track) => {
        this.track = track;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading track:', error);
        this.isLoading = false;
      }
    });
  }

  playTrack(): void {
    if (!this.track) return;

    this.spotifyService.setCurrentTrack(this.track);
    // If embedded as compact, emit event to parent instead of routing
    if (this.compact) {
      this.selected.emit(this.track);
      return;
    }

    this.router.navigate(['/']);
  }

  getArtistNames(): string {
    if (!this.track) return '';
    return this.track.artists.map(artist => artist.name).join(', ');
  }

  getAlbumImage(): string {
    if (!this.track) return 'https://via.placeholder.com/300';
    return this.track.album.images[0]?.url || 'https://via.placeholder.com/300';
  }
}

import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Track, AlbumItem, ArtistItem } from '../../models/track.model';
import { SpotifyService } from '../../services/spotify.service';

@Component({
  selector: 'app-inline-detail',
  templateUrl: './inline-detail.component.html',
  styleUrls: ['./inline-detail.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class InlineDetailComponent {
  @Input() type: 'track' | 'album' | 'artist' | null = null;
  @Input() item: Track | AlbumItem | ArtistItem | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() play = new EventEmitter<Track>();
  @Output() openAlbum = new EventEmitter<AlbumItem>();
  @Output() openArtist = new EventEmitter<ArtistItem>();
  // estado para artista
  artistDetails: ArtistItem | null = null;
  artistAlbums: AlbumItem[] = [];
  isLoadingArtist: boolean = false;
  artistError: string = '';

  constructor(private spotifyService: SpotifyService) {}

  onClose() {
    this.close.emit();
  }

  onPlay() {
    if (this.type === 'track' && this.item) {
      this.play.emit(this.item as Track);
    }
  }

  onOpenAlbum() {
    if (this.type === 'album' && this.item) {
      this.openAlbum.emit(this.item as AlbumItem);
    }
  }

  onOpenArtist() {
    if (this.type === 'artist' && this.item) {
      this.openArtist.emit(this.item as ArtistItem);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['type'] || changes['item']) {
      // cuando el detalle cambia y es un artista, cargar info
      if (this.type === 'artist' && this.item && (this.item as any).id) {
        const id = (this.item as any).id;
        this.loadArtistInfo(id);
      } else {
        // limpiar estado
        this.artistDetails = null;
        this.artistAlbums = [];
        this.isLoadingArtist = false;
        this.artistError = '';
      }
    }
  }

  private loadArtistInfo(artistId: string) {
    console.log('[inline-detail] loadArtistInfo', artistId);
    this.isLoadingArtist = true;
    this.artistError = '';
    // Obtener detalles y álbumes en paralelo
    this.spotifyService.getArtist(artistId).subscribe({
      next: (a) => {
        console.log('[inline-detail] artist details loaded', a);
        this.artistDetails = a;
      },
      error: (err) => {
        console.error('Error cargando artista', err);
        this.artistError = 'Error cargando artista';
      }
    });

    this.spotifyService.getArtistAlbums(artistId, 50).subscribe({
      next: (albums) => {
        // Filtrar duplicados por nombre y preparar ids
        const unique: AlbumItem[] = [];
        const seen = new Set<string>();
        const ids: string[] = [];
        albums.forEach(al => {
          if (!seen.has(al.name)) {
            seen.add(al.name);
            unique.push(al);
            if (al.id) ids.push(al.id);
          }
        });

        // Obtener los álbumes completos (máx 20 ids) para obtener 'popularity'
        const idsSlice = ids.slice(0, 20);
        if (idsSlice.length === 0) {
          this.artistAlbums = unique;
          this.isLoadingArtist = false;
          return;
        }

        this.spotifyService.getAlbumsByIds(idsSlice).subscribe({
          next: (fullAlbums) => {
            console.log('[inline-detail] fullAlbums loaded', fullAlbums.length);
            // Ordenar por popularity si está disponible
            const sorted = fullAlbums.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
            // Mantener top 12 más famosos
            this.artistAlbums = sorted.slice(0, 12);
            this.isLoadingArtist = false;
          },
          error: (err) => {
            console.error('Error cargando álbumes completos', err);
            // Si falla, usar la lista única simplificada
            this.artistAlbums = unique;
            this.artistError = 'Error cargando álbumes completos';
            this.isLoadingArtist = false;
          }
        });
      },
      error: (err) => {
        console.error('Error cargando álbumes del artista', err);
        this.artistError = 'Error cargando álbumes';
        this.isLoadingArtist = false;
      }
    });
  }

  getTitle(): string {
    if (!this.item) return '';
    // @ts-ignore
    return (this.item as any).name || '';
  }

  getSubtitle(): string {
    if (!this.item) return '';
    // Track -> artists, Album -> artists, Artist -> none
    // @ts-ignore
    if ((this.item as any).artists && Array.isArray((this.item as any).artists)) {
      // @ts-ignore
      return (this.item as any).artists.map((a: any) => a.name).join(', ');
    }
    return '';
  }

  getImage(): string {
    if (!this.item) return 'https://via.placeholder.com/300';
    // Try common image locations
    // @ts-ignore
    const imgs = (this.item as any).album?.images || (this.item as any).images || [];
    return (imgs && imgs.length > 0) ? imgs[0].url : 'https://via.placeholder.com/300';
  }

  formatFollowers(n?: number | null): string {
    if (!n && n !== 0) return '-';
    const num = Number(n);
    if (isNaN(num)) return '-';
    if (num >= 1000000) {
      return (Math.round((num / 1000000) * 10) / 10).toString() + 'M';
    }
    if (num >= 1000) {
      return (Math.round((num / 1000) * 10) / 10).toString() + 'K';
    }
    return num.toString();
  }
}

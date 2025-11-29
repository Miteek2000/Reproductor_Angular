import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Track, SearchResponse, SearchAllResponse, AlbumItem, ArtistItem } from '../models/track.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SpotifyService {
  private apiUrl = 'https://api.spotify.com/v1';
  private authUrl = 'https://accounts.spotify.com/api/token';
  
  // Token de acceso de Spotify
  private accessToken = '';
  private tokenExpiration = 0;
  
  private currentTrackSubject = new BehaviorSubject<Track | null>(null);
  public currentTrack$ = this.currentTrackSubject.asObservable();
  
  private playlistSubject = new BehaviorSubject<Track[]>([]);
  public playlist$ = this.playlistSubject.asObservable();

  constructor(private http: HttpClient) {
    this.initializeToken();
  }

  /**
   * Inicializa el token usando Client Credentials Flow
   */
  private async initializeToken(): Promise<void> {
    try {
      await this.getAccessToken();
      console.log('✅ Token de Spotify obtenido correctamente');
    } catch (error) {
      console.error('❌ Error al obtener token de Spotify:', error);
    }
  }

  /**
   * Obtiene un access token usando Client Credentials Flow
   */
  private async getAccessToken(): Promise<void> {
    // Si el token aún es válido, no hacer nada
    if (this.accessToken && Date.now() < this.tokenExpiration) {
      return;
    }

    const body = new HttpParams()
      .set('grant_type', 'client_credentials');

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(`${environment.spotify.clientId}:${environment.spotify.clientSecret}`)
    });

    return new Promise((resolve, reject) => {
      this.http.post<any>(this.authUrl, body.toString(), { headers })
        .subscribe({
          next: (response) => {
            this.accessToken = response.access_token;
            // El token expira en 3600 segundos (1 hora), guardamos cuando expira
            this.tokenExpiration = Date.now() + (response.expires_in * 1000);
            resolve();
          },
          error: (error) => {
            console.error('Error obteniendo token:', error);
            reject(error);
          }
        });
    });
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.accessToken}`
    });
  }

  searchTracks(query: string): Observable<Track[]> {
    const params = new HttpParams()
      .set('q', query)
      .set('type', 'track')
      .set('limit', '20');

    return this.http.get<SearchResponse>(`${this.apiUrl}/search`, {
      headers: this.getHeaders(),
      params: params
    }).pipe(
      map(response => response.tracks.items)
    );
  }

  /**
   * Búsqueda multi-tipo: tracks, albums y artists.
   * Devuelve un objeto con las tres colecciones (arrays).
   */
  searchAll(query: string): Observable<{ tracks: Track[]; albums: AlbumItem[]; artists: ArtistItem[] }> {
    const params = new HttpParams()
      .set('q', query)
      .set('type', 'track,album,artist')
      .set('limit', '20');

    // Asegurarse de tener token válido antes de la petición
    return from(this.getAccessToken()).pipe(
      switchMap(() => this.http.get<SearchAllResponse>(`${this.apiUrl}/search`, {
        headers: this.getHeaders(),
        params
      })),
      map(response => ({
        tracks: response.tracks?.items || [],
        albums: response.albums?.items || [],
        artists: response.artists?.items || []
      }))
    );
  }

  getTrack(id: string): Observable<Track> {
    return this.http.get<Track>(`${this.apiUrl}/tracks/${id}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Obtiene las pistas de un álbum por su id.
   * Devuelve un Observable de arreglo de Track (items del endpoint /albums/{id}/tracks).
   */
  getAlbumTracks(albumId: string): Observable<Track[]> {
    // Obtener el álbum completo para tener la información de `album` (imágenes, nombre, etc.)
    return from(this.getAccessToken()).pipe(
      switchMap(() => this.http.get<any>(`${this.apiUrl}/albums/${albumId}`, {
        headers: this.getHeaders()
      })),
      map(album => {
        const items = album.tracks?.items || [];
        // Adjuntar la información del álbum a cada pista para que tenga la forma esperada por la UI
        return items.map((t: any) => ({
          id: t.id,
          name: t.name,
          artists: t.artists?.map((a: any) => ({ id: a.id, name: a.name })) || [],
          album: {
            id: album.id,
            name: album.name,
            images: album.images || []
          },
          duration_ms: t.duration_ms || 0,
          preview_url: t.preview_url || null
        } as Track));
      })
    );
  }

  /**
   * Obtiene la información de un artista por su id
   */
  getArtist(artistId: string): Observable<ArtistItem> {
    return from(this.getAccessToken()).pipe(
      switchMap(() => this.http.get<ArtistItem>(`${this.apiUrl}/artists/${artistId}`, {
        headers: this.getHeaders()
      }))
    );
  }

  /**
   * Obtiene los álbumes de un artista. No ordena por popularidad — devuelve los items tal cual.
   */
  getArtistAlbums(artistId: string, limit: number = 20): Observable<AlbumItem[]> {
    const params = new HttpParams()
      .set('include_groups', 'album,single')
      .set('market', 'ES')
      .set('limit', String(limit));

    return from(this.getAccessToken()).pipe(
      switchMap(() => this.http.get<any>(`${this.apiUrl}/artists/${artistId}/albums`, {
        headers: this.getHeaders(),
        params
      })),
      map(res => res.items || [])
    );
  }

  /**
   * Obtiene información completa de varios álbumes por sus ids (máx 20 ids por petición)
   */
  getAlbumsByIds(ids: string[]): Observable<AlbumItem[]> {
    if (!ids || ids.length === 0) return new Observable<AlbumItem[]>(subscriber => { subscriber.next([]); subscriber.complete(); });
    const chunk = ids.slice(0, 20).join(',');
    return from(this.getAccessToken()).pipe(
      switchMap(() => this.http.get<any>(`${this.apiUrl}/albums`, {
        headers: this.getHeaders(),
        params: new HttpParams().set('ids', chunk)
      })),
      map(res => (res.albums || []).map((alb: any) => ({
        id: alb.id,
        name: alb.name,
        images: alb.images || [],
        release_date: alb.release_date,
        total_tracks: alb.total_tracks,
        artists: alb.artists?.map((a: any) => ({ id: a.id, name: a.name })) || [],
        popularity: alb.popularity
      } as AlbumItem)))
    );
  }

  setCurrentTrack(track: Track): void {
    this.currentTrackSubject.next(track);
    this.addToPlaylist(track);
  }

  addToPlaylist(track: Track): void {
    const currentPlaylist = this.playlistSubject.value;
    const exists = currentPlaylist.find(t => t.id === track.id);
    
    if (!exists) {
      this.playlistSubject.next([...currentPlaylist, track]);
    }
  }

  removeFromPlaylist(trackId: string): void {
    const currentPlaylist = this.playlistSubject.value;
    const updated = currentPlaylist.filter(t => t.id !== trackId);
    this.playlistSubject.next(updated);
    // Si la playlist queda vacía, limpiar la pista actual (sin imagen)
    if (!updated || updated.length === 0) {
      this.currentTrackSubject.next(null);
    }
  }

  /**
   * Vacía la playlist completamente y limpia la pista actual.
   */
  clearPlaylist(): void {
    this.playlistSubject.next([]);
    this.currentTrackSubject.next(null);
  }

  getCurrentTrack(): Track | null {
    return this.currentTrackSubject.value;
  }

  getPlaylist(): Track[] {
    return this.playlistSubject.value;
  }

  /**
   * Verifica si el servicio está listo para hacer peticiones
   */
  isReady(): boolean {
    return this.accessToken !== '' && Date.now() < this.tokenExpiration;
  }

  /**
   * Obtiene información del token (útil para debugging)
   */
  getTokenInfo(): { hasToken: boolean; expiresIn: number } {
    return {
      hasToken: this.accessToken !== '',
      expiresIn: Math.max(0, Math.floor((this.tokenExpiration - Date.now()) / 1000))
    };
  }
}

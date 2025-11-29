export interface Track {
  id: string;
  name: string;
  artists: Artist[];
  album: Album;
  duration_ms: number;
  preview_url: string | null;
}

export interface Artist {
  id: string;
  name: string;
}

export interface Album {
  id: string;
  name: string;
  images: Image[];
}

export interface Image {
  url: string;
  height: number;
  width: number;
}

export interface SearchResponse {
  tracks: {
    items: Track[];
  };
}

export interface AlbumItem {
  id: string;
  name: string;
  images: Image[];
  release_date?: string;
  total_tracks?: number;
  artists?: Artist[];
  popularity?: number;
}

export interface ArtistItem {
  id: string;
  name: string;
  images?: Image[];
  followers?: { total: number };
  genres?: string[];
  popularity?: number;
}

export interface SearchAllResponse {
  tracks?: { items: Track[] };
  albums?: { items: AlbumItem[] };
  artists?: { items: ArtistItem[] };
}

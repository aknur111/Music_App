export interface JamendoMusicInfo {
  tags?: {
    genres?: string[]
  }
}

export interface JamendoTrack {
  id: string
  name: string
  duration: number
  artist_id: string
  artist_name: string
  album_id: string
  album_name: string
  image: string
  audio: string
  releasedate: string
  musicinfo?: JamendoMusicInfo
}

export interface JamendoAlbum {
  id: string
  name: string
  artist_id: string
  artist_name: string
  image: string
  releasedate: string
  musicinfo?: JamendoMusicInfo
}

export interface JamendoArtist {
  id: string
  name: string
  image: string
  website: string
  joindate: string
  musicinfo?: JamendoMusicInfo
}

export interface JamendoResponse<T> {
  headers: {
    status: string
    code: number
    error_message: string
    warnings: string
    results_count: number
  }
  results: T[]
}

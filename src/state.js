function getStoredValue(key, fallback = '') {
  try {
    return window.localStorage.getItem(key) || fallback;
  } catch (error) {
    return fallback;
  }
}

function getStoredJson(key, fallback) {
  try {
    return JSON.parse(window.localStorage.getItem(key) || JSON.stringify(fallback));
  } catch (error) {
    return fallback;
  }
}

export const state = {
  tmdbApiKey: getStoredValue('posterboxd_tmdb_key'),
  currentView: 'home',
  hasSelectedMedia: false,
  archetype: 'floatingticket',
  aspectRatio: '9:16',
  mediaType: 'movie',
  tmdbId: null,
  title: '',
  year: '',
  director: '',
  writer: '',
  dop: '',
  music: '',
  cast: '',
  genre: '',
  runtime: '',
  spine: '',
  episodeTitle: '',
  seasonNumber: '',
  episodeNumber: '',
  _baseTvDetails: null,
  _currentSeasonData: null,
  _currentSeasonAssets: null,
  rating: 4.5,
  isLiked: false,
  medium: 'THEATER',
  watchedAt: '',
  review: '',
  detailedReview: '',
  showDetailedReview: true,
  username: getStoredValue('posterboxd_username'),
  watchedDate: new Date().toISOString().split('T')[0],
  tags: '',
  posters: [],
  backdrops: [],
  logos: [],
  selectedPosterIndex: 0,
  selectedBackdropIndex: 0,
  selectedLogoIndex: 0,
  useLogoImage: true,
  posterImg: null,
  backdropImg: null,
  logoImg: null,
  palette: ['#1C1B1A', '#2D2B28', '#8C857B', '#C9C2B5', '#F4EFE6'],
  tintBackdropWithPalette: true,
  gradientOverlay: true,
  filmGrain: true,
  showQrCode: false,
  marqueeBulbMode: true,
  isFromLetterboxd: false,
  letterboxdUrl: '',
  backdropBrightness: 55,
  backdropBlur: 14,
  posterScale: 1.0,
  posterOffsetX: 0,
  posterOffsetY: 0,
  posterRadius: 20,
  fontScale: 1.0,
  sectionSpacing: 1.0,
  footerScale: 1.0,
  isInteractiveEdit: false,
  selectedElementId: null,
  elementTransformsByArchetype: getStoredJson('posterboxd_transforms_v3', {}),
  hitBoxes: []
};

export function resetMediaState() {
  state.tmdbId = null;
  state.title = '';
  state.year = '';
  state.director = '';
  state.writer = '';
  state.dop = '';
  state.music = '';
  state.cast = '';
  state.genre = '';
  state.runtime = '';
  state.spine = '';
  state.episodeTitle = '';
  state.seasonNumber = '';
  state.episodeNumber = '';
  state._baseTvDetails = null;
  state._currentSeasonData = null;
  state._currentSeasonAssets = null;
  state.review = '';
  state.detailedReview = '';
  state.posters = [];
  state.backdrops = [];
  state.logos = [];
  state.selectedPosterIndex = 0;
  state.selectedBackdropIndex = 0;
  state.selectedLogoIndex = 0;
  state.posterImg = null;
  state.backdropImg = null;
  state.logoImg = null;
  state.palette = ['#1C1B1A', '#2D2B28', '#8C857B', '#C9C2B5', '#F4EFE6'];
  state.posterOffsetX = 0;
  state.posterOffsetY = 0;
}

export { getStoredValue };

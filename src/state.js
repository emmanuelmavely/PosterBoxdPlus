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
  archetype: 'floatingticket',
  aspectRatio: '9:16',
  mediaType: 'movie',
  tmdbId: null,
  title: 'Dune: Part Two',
  year: '2024',
  director: 'Denis Villeneuve',
  writer: 'Denis Villeneuve, Jon Spaihts',
  dop: 'Greig Fraser',
  music: 'Hans Zimmer',
  cast: 'Timothée Chalamet, Zendaya, Rebecca Ferguson, Javier Bardem',
  genre: 'Science Fiction | Adventure',
  runtime: '2h 46m',
  spine: '#2024',
  episodeTitle: '',
  seasonNumber: '',
  episodeNumber: '',
  rating: 4.5,
  isLiked: true,
  medium: 'THEATER',
  watchedAt: '',
  review: 'Denis Villeneuve crafts a mythic science fiction spectacle, anchored by magnetic performances from Timothée Chalamet and Zendaya.',
  detailedReview: '',
  showDetailedReview: true,
  username: getStoredValue('posterboxd_username'),
  watchedDate: new Date().toISOString().split('T')[0],
  tags: 'imax, 70mm, sci-fi',
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
  palette: ['#D96B27', '#6E260E', '#F4B860', '#2E1509', '#FCE5B8'],
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

export { getStoredValue };

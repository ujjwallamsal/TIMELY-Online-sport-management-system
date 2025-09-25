export const ENDPOINTS = {
  // health/docs
  health:'/api/health/', docs:'/api/docs/', schema:'/api/schema/',

  // auth/user
  login:'/api/auth/login/', refresh:'/api/auth/refresh/', register:'/api/auth/register/',
  me:'/api/me/', users:'/api/users/',

  // events domain
  events:'/api/events/', event:(id:number)=>`/api/events/${id}/`,
  eventAnnounce:(id:number)=>`/api/events/${id}/announce/`,
  eventCancel:(id:number)=>`/api/events/${id}/cancel/`,
  eventFixtures:(id:number)=>`/api/events/${id}/fixtures/`,
  eventGenFixtures:(id:number)=>`/api/events/${id}/fixtures/generate/`,
  eventLeaderboard:(id:number)=>`/api/events/${id}/leaderboard/`,
  venues:'/api/venues/', venue:(id:number)=>`/api/venues/${id}/`,
  venueSlots:(id:number)=>`/api/venues/${id}/slots/`,
  sports:'/api/sports/',

  // public
  publicEvents:'/api/public/events/', publicEvent:(id:number)=>`/api/public/events/${id}/`,
  publicEventFixtures:(id:number)=>`/api/public/events/${id}/fixtures/`,
  publicEventResults:(id:number)=>`/api/public/events/${id}/results/`,
  publicEventLeaderboard:(id:number)=>`/api/public/events/${id}/leaderboard/`,

  // registrations
  registrations:'/api/registrations/', registration:(id:number)=>`/api/registrations/${id}/`,
  registrationDocs:(id:number)=>`/api/registrations/${id}/documents/`,
  registrationApprove:(id:number)=>`/api/registrations/${id}/approve/`,
  registrationReject:(id:number)=>`/api/registrations/${id}/reject/`,

  // fixtures & results
  fixtures:'/api/fixtures/', results:'/api/results/',
  result:(id:number)=>`/api/results/${id}/`, fixtureResult:(fixId:number)=>`/api/fixtures/${fixId}/result/`,

  // content
  news:'/api/news/', newsItem:(id:number)=>`/api/news/${id}/`,
  galleryAlbums:'/api/gallery/albums/', galleryMedia:'/api/gallery/media/', mediaItem:(id:number)=>`/api/gallery/media/${id}/`,
  // content public pages/legal
  publicPages:'/api/content/public/pages/',
  publicPageBySlug:(slug:string)=>`/api/content/public/pages/by_slug/?slug=${encodeURIComponent(slug)}`,
  legalTerms:'/api/content/public/legal/terms/',
  legalPrivacy:'/api/content/public/legal/privacy/',
  
  // aliases for backward compatibility
  publicNews:'/api/news/',
  publicMedia:'/api/gallery/media/',

  // tickets
  checkout:'/api/tickets/checkout/', myTickets:'/api/tickets/me/tickets/',
  ticketQR:(id:number)=>`/api/tickets/tickets/${id}/qr/`,
  ticketUse:(id:number)=>`/api/tickets/tickets/${id}/use/`,
  verify:'/api/tickets/verify/',

  // notifications (we'll use for approval workflow)
  notifications:'/api/notifications/', threads:'/api/notifications/threads/', messages:'/api/notifications/messages/',

  // role applications
  applyAthlete:'/api/auth/apply-athlete/',
  applyCoach:'/api/auth/apply-coach/',
  applyOrganizer:'/api/auth/apply-organizer/',
  myApplications:'/api/auth/applications/',

  // realtime (SSE; fallback to polling if 404)
  sseEvent:(id:number)=>`/api/events/${id}/stream/`,
  sseEventResults:(id:number)=>`/api/events/${id}/results/stream/`,
};

// Normalize API URL - strips accidental '/api' prefixes
export const normalizeApiUrl = (url: string): string => {
  // If URL already starts with /api/, return as is
  if (url.startsWith('/api/')) {
    return url;
  }
  
  // If URL starts with /, add /api prefix
  if (url.startsWith('/')) {
    return `/api${url}`;
  }
  
  // If URL doesn't start with /, add /api/ prefix
  return `/api/${url}`;
};
export const ENDPOINTS = {
  // health/docs
  health:'/health/', docs:'/docs/', schema:'/schema/',

  // auth/user
  login:'/auth/login/', refresh:'/auth/refresh/', register:'/auth/register/',
  me:'/me/', users:'/users/',
  changePassword:(userId:number)=>`/users/${userId}/change-password/`,

  // events domain
  events:'/events/', event:(id:number)=>`/events/${id}/`,
  eventAnnounce:(id:number)=>`/events/${id}/announce/`,
  eventCancel:(id:number)=>`/events/${id}/cancel/`,
  eventFixtures:(id:number)=>`/events/${id}/fixtures/`,
  eventGenFixtures:(id:number)=>`/events/${id}/fixtures/generate/`,
  eventLeaderboard:(id:number)=>`/events/${id}/leaderboard/`,
  venues:'/venues/', venue:(id:number)=>`/venues/${id}/`,
  venueSlots:(id:number)=>`/venues/${id}/slots/`,
  sports:'/sports/',

  // public
  publicEvents:'/public/events/', publicEvent:(id:number)=>`/public/events/${id}/`,
  publicEventFixtures:(id:number)=>`/public/events/${id}/fixtures/`,
  publicEventResults:(id:number)=>`/public/events/${id}/results/`,
  publicEventLeaderboard:(id:number)=>`/public/events/${id}/leaderboard/`,

  // registrations
  registrations:'/registrations/', registration:(id:number)=>`/registrations/${id}/`,
  registrationDocs:(id:number)=>`/registrations/${id}/documents/`,
  registrationApprove:(id:number)=>`/registrations/${id}/approve/`,
  registrationReject:(id:number)=>`/registrations/${id}/reject/`,
  registrationCheckout:'/registrations/checkout/',
  registrationSuccess:'/registrations/success/',
  myRegistrations:'/registrations/mine/',

  // fixtures & results
  fixtures:'/fixtures/', fixture:(id:number)=>`/fixtures/${id}/`, results:'/results/',
  result:(id:number)=>`/results/${id}/`, fixtureResult:(fixId:number)=>`/fixtures/${fixId}/result/`,

  // content
  news:'/news/', newsItem:(id:number)=>`/news/${id}/`,
  galleryAlbums:'/gallery/albums/', galleryMedia:'/gallery/media/', mediaItem:(id:number)=>`/gallery/media/${id}/`,
  // content public pages/legal
  publicPages:'/content/public/pages/',
  publicPageBySlug:(slug:string)=>`/content/public/pages/by_slug/?slug=${encodeURIComponent(slug)}`,
  legalTerms:'/content/public/legal/terms/',
  legalPrivacy:'/content/public/legal/privacy/',
  
  // aliases for backward compatibility
  publicNews:'/news/',
  publicMedia:'/gallery/media/',

  // tickets
  checkout:'/tickets/checkout/', myTickets:'/tickets/me/tickets/', ticketsFree:'/tickets/free/', freeTicket:'/tickets/free/',
  ticketQR:(id:number)=>`/tickets/tickets/${id}/qr/`,
  ticketUse:(id:number)=>`/tickets/tickets/${id}/use/`,
  verify:'/tickets/verify/',

  // notifications (we'll use for approval workflow)
  notifications:'/notifications/', threads:'/notifications/threads/', messages:'/notifications/messages/',

  // role applications
  applyAthlete:'/auth/apply-athlete/',
  applyCoach:'/auth/apply-coach/',
  applyOrganizer:'/auth/apply-organizer/',
  myApplications:'/auth/applications/',

  // realtime (SSE; fallback to polling if 404)
  sseEvent:(id:number)=>`/events/${id}/stream/`,
  sseEventResults:(id:number)=>`/events/${id}/results/stream/`,
} as const;

// Normalize API URL - strips accidental '/api' prefixes
export const normalizeApiUrl = (url: string): string => {
  // Remove leading slash if present
  const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
  
  // If it starts with 'api/', remove it (double API prefix protection)
  if (cleanUrl.startsWith('api/')) {
    return cleanUrl.slice(4);
  }
  
  // Return with leading slash
  return `/${cleanUrl}`;
};
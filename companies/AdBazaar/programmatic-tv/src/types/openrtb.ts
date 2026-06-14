/**
 * OpenRTB 2.6 Extended Types for CTV Programmatic Buying
 * ClearLine equivalent interface
 */

// Device Types (OpenRTB 2.5)
export enum DeviceType {
  UNKNOWN = 0,
  DESKTOP = 1,
  TV = 3,
  PHONE = 4,
  TABLET = 5,
  CONNECTED_TV = 6,
  SET_TOP_BOX = 7
}

// Connection Types
export enum ConnectionType {
  UNKNOWN = 0,
  ETHERNET = 1,
  WIFI = 2,
  CELLULAR_UNKNOWN = 3,
  CELLULAR_2G = 4,
  CELLULAR_3G = 5,
  CELLULAR_4G = 6,
  CELLULAR_5G = 7
}

// CTV Device Categories
export enum CTVDeviceCategory {
  SMART_TV = 'smarttv',
  SET_TOP_BOX = 'settop',
  GAMING_CONSOLE = 'gaming',
  STREAMING_DEVICE = 'streaming'
}

// Auction Types
export enum AuctionType {
  FIRST_PRICE = 1,
  SECOND_PRICE = 2,
  FIXED_PRICE = 3
}

// Content Linearity
export enum ContentLinearity {
  LINEAR = 1,
  NON_LINEAR = 2
}

// Deal Types
export enum DealType {
  PROGRAMMATIC_GUARANTEED = 'programmatic-guaranteed',
  PREFERRED_DEAL = 'preferred-deal',
  PRIVATE_MARKETPLACE = 'private-marketplace'
}

// Deal Status
export enum DealStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  EXPIRED = 'expired'
}

// CTV Device Extension
export interface CTVDeviceExtension {
  deviceCategory: CTVDeviceCategory;
  appBundle: string;
  isLivingRoom: boolean;
  screenSize?: {
    width: number;
    height: number;
  };
  drmSupport?: string[];
}

// Video Object (OpenRTB 2.6)
export interface Video {
  mimes: string[];
  minduration: number;
  maxduration: number;
  linearity: ContentLinearity;
  skip?: number;
  skipmin?: number;
  skipafter?: number;
  placement?: number;
  protocol?: number;
  protocols?: number[];
  w?: number;
  h?: number;
  startdelay?: number;
  sequence?: number;
  battr?: number[];
  maxextended?: number;
  minbirtrate?: number;
  maxbirtrate?: number;
  boxingallowed?: number;
  playbackmethod?: number[];
  playbackend?: number;
  delivery?: number[];
  pos?: number;
  ctv?: CTVDeviceExtension;
}

// PMP Deal Object
export interface PMPDeal {
  id: string;
  bidfloor: number;
  bidfloorcur: string;
  at?: AuctionType;
  wseat?: string[];
  wadomain?: string[];
  ext?: Record<string, unknown>;
}

// Private Marketplace
export interface PMP {
  private_auction: number;
  deals: PMPDeal[];
  ext?: Record<string, unknown>;
}

// Impression Object
export interface Imp {
  id: string;
  bidfloor?: number;
  bidfloorcur?: string;
  clickbrowser?: number;
  tagid?: string;
  bidflooradjustments?: unknown[];
  video?: Video;
  pmp?: PMP;
  ext?: Record<string, unknown>;
}

// Geo Object
export interface Geo {
  lat?: number;
  lon?: number;
  country?: string;
  region?: string;
  regionfips104?: string;
  metro?: string;
  city?: string;
  zip?: string;
  type?: number;
  utcoffset?: number;
  timezone?: string;
  ipservice?: number;
}

// Device Object
export interface Device {
  ua?: string;
  devicetype?: DeviceType;
  make?: string;
  model?: string;
  os?: string;
  osv?: string;
  hwv?: string;
  h?: number;
  w?: number;
  ppi?: number;
  pxratio?: number;
  js?: number;
  geofetch?: number;
  connectiontype?: ConnectionType;
  ifa?: string;
  didsha1?: string;
  didmd5?: string;
  dpidmd5?: string;
  dnt?: number;
  lmt?: number;
  ip?: string;
  ipv6?: string;
  useragent?: string;
  useragentfamily?: string;
  devicename?: string;
  devicebrand?: string;
  geo?: Geo;
  ext?: Record<string, unknown>;
}

// App Object
export interface App {
  id: string;
  name?: string;
  bundle?: string;
  domain?: string;
  storeurl?: string;
  cattax?: number;
  cat?: string[];
  seccat?: string[];
  privacypolicy?: number;
  paid?: number;
  keywords?: string;
  publisher?: Publisher;
  content?: Content;
  ext?: Record<string, unknown>;
}

// Publisher Object
export interface Publisher {
  id?: string;
  name?: string;
  cat?: string[];
  domain?: string;
  ext?: Record<string, unknown>;
}

// Content Object
export interface Content {
  id?: string;
  episode?: number;
  title?: string;
  series?: string;
  season?: string;
  producer?: Producer;
  cattax?: number;
  cat?: string[];
  liveoffline?: number;
  sourcelanguage?: string;
  datatest?: string;
  nbr?: number;
  language?: string;
  embeddable?: number;
  keywords?: string;
  ext?: Record<string, unknown>;
}

// Producer Object
export interface Producer {
  id?: string;
  name?: string;
  cattax?: number;
  cat?: string[];
  domain?: string;
  ext?: Record<string, unknown>;
}

// User Object
export interface User {
  id?: string;
  buyeruid?: string;
  yob?: number;
  gender?: string;
  keywords?: string;
  birthtime?: string;
  country?: string;
  geo?: Geo;
  data?: Data[];
  ext?: Record<string, unknown>;
}

// Data Object
export interface Data {
  id?: string;
  name?: string;
  segment?: Segment[];
  ext?: Record<string, unknown>;
}

// Segment Object
export interface Segment {
  id?: string;
  name?: string;
  value?: string;
  ext?: Record<string, unknown>;
}

// CTV Bid Request (Main Request Type)
export interface CTVBidRequest {
  id: string;
  at: AuctionType;
  tmax?: number;
  imp: Imp[];
  site?: Site;
  app?: App;
  device?: Device;
  user?: User;
  test?: number;
  at?: number;
  allimps?: number;
  cur?: string[];
  bcat?: string[];
  bats?: number[];
  wseat?: string[];
  gdpr?: number;
  gpp?: string;
  gpp_sid?: string;
  regs?: {
    coppa?: number;
    gdpr?: number;
    gpp?: number;
  };
  ext?: Record<string, unknown>;
}

// Site Object
export interface Site {
  id: string;
  name?: string;
  domain?: string;
  cat?: string[];
  sectioncat?: string[];
  pagecat?: string[];
  page?: string;
  ref?: string;
  search?: string;
  mobile?: number;
  privacypolicy?: number;
  publisher?: Publisher;
  content?: Content;
  keywords?: string;
  ext?: Record<string, unknown>;
}

// Bid Response Seat Bid
export interface BidSeat {
  seat?: string;
  group?: number;
  bid?: Bid[];
}

// Bid Object
export interface Bid {
  id: string;
  impid: string;
  price: number;
  nurl?: string;
  burl?: string;
  lurl?: string;
  adm?: string;
  adid?: string;
  crid?: string;
  cridtype?: string;
  cid?: string;
  tactic?: string;
  bidfloor?: number;
  bidfloorcur?: string;
  dealid?: string;
  iurl?: string;
  cat?: string[];
  w?: number;
  h?: number;
  dur?: number;
  attr?: number[];
  api?: number;
  bund?: string;
  protocol?: number;
  qagmediarating?: number;
  loadmonitor?: number;
  videover?: string;
  eventtrackers?: unknown[];
  videoxml?: string;
  rid?: string;
  ext?: Record<string, unknown>;
}

// CTV Bid Response
export interface CTVBidResponse {
  id: string;
  bidid?: string;
  cur?: string;
  customdata?: string;
  nbr?: number;
  seatbid?: BidSeat[];
  ext?: Record<string, unknown>;
}

// Batch Bid Request
export interface BatchBidRequest {
  requestId: string;
  requests: CTVBidRequest[];
  options?: {
    parallel?: boolean;
    timeout?: number;
  };
}

// Batch Bid Response
export interface BatchBidResponse {
  requestId: string;
  responses: CTVBidResponse[];
  errors?: {
    requestId: string;
    error: string;
  }[];
}

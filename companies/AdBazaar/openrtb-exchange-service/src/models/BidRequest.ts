import mongoose, { Document, Schema } from 'mongoose';

// OpenRTB 2.6 compliant Bid Request model
export interface IBidRequest extends Document {
  requestId: string;
  imp: Imp[];
  site?: Site;
  app?: App;
  device?: Device;
  user?: User;
  test?: number;
  tmax?: number;
  ttr?: number;
  wseat?: string[];
  bseat?: string[];
  allimps?: number;
  cur?: string[];
  wlang?: string[];
  source?: Source;
  regs?: Regs;
  ext?: Record<string, unknown>;
  // Exchange-specific fields
  status: 'pending' | 'processing' | 'completed' | 'expired' | 'error';
  bidCount: number;
  auctionType: number;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Imp {
  id: string;
  banner?: Banner;
  video?: Video;
  audio?: Audio;
  native?: Native;
  pmp?: Pmp;
  displaymanager?: string;
  displaymanagerver?: string;
  instl?: number;
  tagid?: string;
  bidfloor?: number;
  bidfloorcur?: string;
  clickbrowser?: number;
  iframebuster?: string[];
  pmtmp?: string;
  exp?: number;
  ext?: Record<string, unknown>;
}

export interface Banner {
  w?: number;
  h?: number;
  wmax?: number;
  hmax?: number;
  wmin?: number;
  hmin?: number;
  btype?: number[];
  battr?: number[];
  pos?: number;
  mimes?: string[];
  topframe?: number;
  expdir?: number[];
  api?: number[];
  id?: string;
  vcm?: number;
  ext?: Record<string, unknown>;
}

export interface Video {
  mimes: string[];
  minduration?: number;
  maxduration?: number;
  protocols?: number[];
  protocol?: number;
  w?: number;
  h?: number;
  startdelay?: number;
  placement?: number;
  linearity?: number;
  sequence?: number;
  battr?: number[];
  maxextended?: number;
  minbitrate?: number;
  maxbitrate?: number;
  boxingallowed?: number;
  playbackmethod?: number[];
  playbackend?: number;
  delivery?: number[];
  pos?: number;
  companionad?: Banner[];
  api?: number[];
  companiontype?: number[];
  ext?: Record<string, unknown>;
}

export interface Audio {
  mimes: string[];
  minduration?: number;
  maxduration?: number;
  protocols?: number[];
  protocol?: number;
  w?: number;
  h?: number;
  startdelay?: number;
  placement?: number;
  linearity?: number;
  sequence?: number;
  battr?: number[];
  maxextended?: number;
  minbitrate?: number;
  maxbitrate?: number;
  delivery?: number[];
  companionad?: Banner[];
  api?: number[];
  companiontype?: number[];
  ext?: Record<string, unknown>;
}

export interface Native {
  request: string;
  ver?: string;
  api?: number[];
  battr?: number[];
  ext?: Record<string, unknown>;
}

export interface Pmp {
  private_auction: number;
  deals: DealBid[];
  ext?: Record<string, unknown>;
}

export interface DealBid {
  id: string;
  bidfloor?: number;
  bidfloorcur?: string;
  at?: number;
  wseat?: string[];
  wadomain?: string[];
  ext?: Record<string, unknown>;
}

export interface Site {
  id?: string;
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

export interface App {
  id?: string;
  name?: string;
  bundle?: string;
  domain?: string;
  storeurl?: string;
  cat?: string[];
  sectioncat?: string[];
  pagecat?: string[];
  ver?: string;
  privacy?: number;
  paid?: number;
  publisher?: Publisher;
  content?: Content;
  keywords?: string;
  ext?: Record<string, unknown>;
}

export interface Device {
  ua?: string;
  geo?: Geo;
  dnt?: number;
  lmt?: number;
  ip?: string;
  ipv6?: string;
  devicetype?: number;
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
  flashver?: string;
  language?: string;
  carrier?: string;
  connectiontype?: number;
  ifa?: string;
  didsha1?: string;
  didmd5?: string;
  dpidsha1?: string;
  dpidmd5?: string;
  macsha1?: string;
  macmd5?: string;
  ext?: Record<string, unknown>;
}

export interface User {
  id?: string;
  buyeruid?: string;
  yob?: number;
  gender?: string;
  keywords?: string;
  customdata?: string;
  geo?: Geo;
  data?: Data[];
  ext?: Record<string, unknown>;
}

export interface Geo {
  lat?: number;
  lon?: number;
  type?: number;
  country?: string;
  region?: string;
  regionfips104?: string;
  metro?: string;
  city?: string;
  zip?: string;
  utcoffset?: number;
  locale?: string;
  ext?: Record<string, unknown>;
}

export interface Publisher {
  id?: string;
  name?: string;
  cat?: string[];
  domain?: string;
  ext?: Record<string, unknown>;
}

export interface Content {
  id?: string;
  episode?: number;
  title?: string;
  series?: string;
  season?: string;
  author?: string;
  album?: string;
  artist?: string;
  genre?: string;
  song?: string;
  dur?: number;
  livestream?: number;
  sourcetype?: number;
  sourcerel?: number;
  url?: string;
  cat?: string[];
  prodq?: number;
  contentrating?: string;
  userrating?: string;
  qstarformat?: number;
  embeddable?: number;
  data?: Data[];
  ext?: Record<string, unknown>;
}

export interface Data {
  id?: string;
  name?: string;
  segment?: Segment[];
  ext?: Record<string, unknown>;
}

export interface Segment {
  id?: string;
  name?: string;
  value?: string;
  ext?: Record<string, unknown>;
}

export interface Source {
  fd?: number;
  tid?: string;
  ts?: number;
  pchain?: string;
  ext?: Record<string, unknown>;
}

export interface Regs {
  coppa?: number;
  gdpr?: number;
  us_privacy?: string;
  ext?: Record<string, unknown>;
}

const ImpSchema = new Schema<Imp>(
  {
    id: { type: String, required: true },
    banner: { type: Schema.Types.Mixed },
    video: { type: Schema.Types.Mixed },
    audio: { type: Schema.Types.Mixed },
    native: { type: Schema.Types.Mixed },
    pmp: { type: Schema.Types.Mixed },
    displaymanager: String,
    displaymanagerver: String,
    instl: Number,
    tagid: String,
    bidfloor: Number,
    bidfloorcur: { type: String, default: 'USD' },
    clickbrowser: Number,
    iframebuster: [String],
    pmtmp: String,
    exp: Number,
    ext: { type: Schema.Types.Mixed }
  },
  { _id: false }
);

const BidRequestSchema = new Schema<IBidRequest>(
  {
    requestId: { type: String, required: true, index: true, unique: true },
    imp: { type: [ImpSchema], required: true },
    site: { type: Schema.Types.Mixed },
    app: { type: Schema.Types.Mixed },
    device: { type: Schema.Types.Mixed },
    user: { type: Schema.Types.Mixed },
    test: { type: Number, default: 0 },
    tmax: Number,
    ttr: Number,
    wseat: [String],
    bseat: [String],
    allimps: Number,
    cur: [String],
    wlang: [String],
    source: { type: Schema.Types.Mixed },
    regs: { type: Schema.Types.Mixed },
    ext: { type: Schema.Types.Mixed },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'expired', 'error'],
      default: 'pending',
      index: true
    },
    bidCount: { type: Number, default: 0 },
    auctionType: { type: Number, default: 2 },
    processedAt: Date
  },
  {
    timestamps: true,
    collection: 'bid_requests'
  }
);

// Indexes for query performance
BidRequestSchema.index({ status: 1, createdAt: -1 });
BidRequestSchema.index({ 'site.id': 1 });
BidRequestSchema.index({ 'device.ip': 1 });
BidRequestSchema.index({ createdAt: -1 });

export const BidRequest = mongoose.model<IBidRequest>('BidRequest', BidRequestSchema);
export default BidRequest;
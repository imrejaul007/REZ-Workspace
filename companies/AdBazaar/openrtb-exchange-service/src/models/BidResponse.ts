import mongoose, { Document, Schema } from 'mongoose';

// OpenRTB 2.6 compliant Bid Response model
export interface IBidResponse extends Document {
  bidRequestId: string;
  id: string;
  bidid?: string;
  cur?: string;
  customdata?: string;
  nbr?: number;
  seatbid: SeatBid[];
  ext?: Record<string, unknown>;
  // Exchange-specific fields
  status: 'pending' | 'winning' | 'lost' | 'expired' | 'error';
  auctionId?: string;
  winningPrice?: number;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SeatBid {
  seat: string;
  group?: number;
  expire?: number;
  bid: Bid[];
  ext?: Record<string, unknown>;
}

export interface Bid {
  id: string;
  impid: string;
  price: number;
  nurl?: string;
  burl?: string;
  lurl?: string;
  adm?: string;
  adid?: string;
  adomain?: string[];
  bundle?: string;
  iurl?: string;
  cid?: string;
  crid?: string;
  tactic?: string;
  cat?: string[];
  attr?: number[];
  anlytics?: object[];
  ext?: Record<string, unknown>;
  // Native ad markup (when adm is '*')
  native?: object;
}

export interface NativeMarkup {
  ver?: string;
  layout?: number;
  adunit?: number;
  plcmt?: number;
  plcmttype?: number;
  assets: NativeAsset[];
  link: NativeLink;
  imptrackers?: string[];
  jstracker?: string;
  ext?: Record<string, unknown>;
}

export interface NativeAsset {
  id: number;
  required?: number;
  title?: {
    text: string;
    len?: number;
    ext?: Record<string, unknown>;
  };
  img?: {
    type?: number;
    url: string;
    w?: number;
    h?: number;
    wmin?: number;
    hmin?: number;
    mimes?: string[];
    ext?: Record<string, unknown>;
  };
  video?: {
    vasttag: string;
    ext?: Record<string, unknown>;
  };
  data?: {
    type: number;
    value: string;
    ext?: Record<string, unknown>;
  };
  ext?: Record<string, unknown>;
}

export interface NativeLink {
  url: string;
  clicktrackers?: string[];
  fallback?: string;
  ext?: Record<string, unknown>;
}

// Extension for bid response
export interface BidResponseExt {
  bid_feedback?: BidFeedback[];
  enforcements?: Enforcements;
  fcap?: Fcap;
}

export interface BidFeedback {
  request_id?: string;
  creative_id?: string;
  bid_id?: string;
  auction_id?: string;
  seat?: string;
  loss?: string;
  reason?: number;
  cpm?: number;
  cpm_buckets?: CpmBucket[];
  time?: number;
  paved_floor?: boolean;
  ext?: Record<string, unknown>;
}

export interface CpmBucket {
  min?: number;
  max?: number;
  step?: number;
}

export interface Enforcements {
  privacy?: PrivacyEnforcement;
  floor?: FloorEnforcement;
}

export interface PrivacyEnforcement {
  gaia?: boolean;
  ccpap?: boolean;
  lgpd?: boolean;
  pd?: boolean;
  uspnat?: boolean;
  uspstate?: boolean;
  uspcal?: boolean;
  uspva?: boolean;
  gdpr?: boolean;
}

export interface FloorEnforcement {
  bid_floor?: boolean;
  bid_floor_cur?: string;
  bid_floor_value?: number;
  bid_floor_skip?: boolean;
}

export interface Fcap {
  min_floor?: number;
  max_floor?: number;
  fcap_count?: number;
  fcap_time?: number;
  fcap_time_unit?: string;
}

const BidSchema = new Schema<Bid>(
  {
    id: { type: String, required: true },
    impid: { type: String, required: true },
    price: { type: Number, required: true },
    nurl: String,
    burl: String,
    lurl: String,
    adm: String,
    adid: String,
    adomain: [String],
    bundle: String,
    iurl: String,
    cid: String,
    crid: String,
    tactic: String,
    cat: [String],
    attr: [Number],
    anlytics: [Schema.Types.Mixed],
    native: { type: Schema.Types.Mixed },
    ext: { type: Schema.Types.Mixed }
  },
  { _id: false }
);

const SeatBidSchema = new Schema<SeatBid>(
  {
    seat: { type: String, required: true },
    group: Number,
    expire: Number,
    bid: { type: [BidSchema], required: true },
    ext: { type: Schema.Types.Mixed }
  },
  { _id: false }
);

const BidResponseSchema = new Schema<IBidResponse>(
  {
    bidRequestId: { type: String, required: true, index: true },
    id: { type: String, required: true, index: true },
    bidid: String,
    cur: { type: String, default: 'USD' },
    customdata: String,
    nbr: Number,
    seatbid: { type: [SeatBidSchema], required: true },
    ext: { type: Schema.Types.Mixed },
    status: {
      type: String,
      enum: ['pending', 'winning', 'lost', 'expired', 'error'],
      default: 'pending',
      index: true
    },
    auctionId: { type: String, index: true },
    winningPrice: Number,
    processedAt: Date
  },
  {
    timestamps: true,
    collection: 'bid_responses'
  }
);

// Indexes for query performance
BidResponseSchema.index({ bidRequestId: 1, status: 1 });
BidResponseSchema.index({ auctionId: 1 });
BidResponseSchema.index({ createdAt: -1 });
BidResponseSchema.index({ seatbid: 1 });

export const BidResponse = mongoose.model<IBidResponse>('BidResponse', BidResponseSchema);
export default BidResponse;
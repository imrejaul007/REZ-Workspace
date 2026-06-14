export interface RateLimitRule{id:string;key:string;limit:number;windowMs:number;type:'fixed'|'sliding';enabled:boolean;}
export interface RateLimitEntry{count:number;resetAt:number;firstSeen:number;}

export interface ConfigEntry{key:string;value:any;type:'string'|'number'|'boolean'|'object';description?:string;environment:string;updatedAt:string;}
export interface FeatureFlag{id:string;key:string;enabled:boolean;rules?:any;description?:string;}

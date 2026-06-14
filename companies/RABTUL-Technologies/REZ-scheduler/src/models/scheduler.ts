export interface ScheduledJob{id:string;name:string;cron?:string;intervalMs?:number;handler:string;data?:any;status:'active'|'paused'|'completed';nextRun?:number;lastRun?:number;}
export interface JobRun{id:string;jobId:string;status:'pending'|'running'|'completed'|'failed';startedAt:string;completedAt?:string;result?:any;error?:string;}

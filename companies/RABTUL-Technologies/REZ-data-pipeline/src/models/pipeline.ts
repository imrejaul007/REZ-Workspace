export interface Pipeline{id:string;name:string;steps:PipelineStep[];status:'idle'|'running'|'completed'|'failed';createdAt:string;}
export interface PipelineStep{id:string;type:string;config:any;status:'pending'|'running'|'completed'|'failed';}

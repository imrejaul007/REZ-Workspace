import { z } from 'zod';
export declare const WhatsAppMessageSchema: z.ZodObject<{
    messaging_product: z.ZodLiteral<"whatsapp">;
    to: z.ZodString;
    type: z.ZodEnum<["text", "image", "document", "audio", "video", "template", "interactive"]>;
    text: z.ZodOptional<z.ZodObject<{
        preview_url: z.ZodOptional<z.ZodBoolean>;
        body: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        body: string;
        preview_url?: boolean | undefined;
    }, {
        body: string;
        preview_url?: boolean | undefined;
    }>>;
    image: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        link: z.ZodOptional<z.ZodString>;
        caption: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id?: string | undefined;
        link?: string | undefined;
        caption?: string | undefined;
    }, {
        id?: string | undefined;
        link?: string | undefined;
        caption?: string | undefined;
    }>>;
    template: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        language: z.ZodObject<{
            code: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            code: string;
        }, {
            code: string;
        }>;
        components: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        language: {
            code: string;
        };
        components?: any[] | undefined;
    }, {
        name: string;
        language: {
            code: string;
        };
        components?: any[] | undefined;
    }>>;
    interactive: z.ZodOptional<z.ZodObject<{
        type: z.ZodEnum<["button", "list_reply", "product", "product_list"]>;
        header: z.ZodOptional<z.ZodAny>;
        body: z.ZodObject<{
            text: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            text: string;
        }, {
            text: string;
        }>;
        footer: z.ZodOptional<z.ZodAny>;
        actions: z.ZodAny;
    }, "strip", z.ZodTypeAny, {
        type: "product" | "button" | "list_reply" | "product_list";
        body: {
            text: string;
        };
        actions?: any;
        header?: any;
        footer?: any;
    }, {
        type: "product" | "button" | "list_reply" | "product_list";
        body: {
            text: string;
        };
        actions?: any;
        header?: any;
        footer?: any;
    }>>;
}, "strip", z.ZodTypeAny, {
    type: "text" | "image" | "document" | "video" | "audio" | "template" | "interactive";
    to: string;
    messaging_product: "whatsapp";
    text?: {
        body: string;
        preview_url?: boolean | undefined;
    } | undefined;
    image?: {
        id?: string | undefined;
        link?: string | undefined;
        caption?: string | undefined;
    } | undefined;
    template?: {
        name: string;
        language: {
            code: string;
        };
        components?: any[] | undefined;
    } | undefined;
    interactive?: {
        type: "product" | "button" | "list_reply" | "product_list";
        body: {
            text: string;
        };
        actions?: any;
        header?: any;
        footer?: any;
    } | undefined;
}, {
    type: "text" | "image" | "document" | "video" | "audio" | "template" | "interactive";
    to: string;
    messaging_product: "whatsapp";
    text?: {
        body: string;
        preview_url?: boolean | undefined;
    } | undefined;
    image?: {
        id?: string | undefined;
        link?: string | undefined;
        caption?: string | undefined;
    } | undefined;
    template?: {
        name: string;
        language: {
            code: string;
        };
        components?: any[] | undefined;
    } | undefined;
    interactive?: {
        type: "product" | "button" | "list_reply" | "product_list";
        body: {
            text: string;
        };
        actions?: any;
        header?: any;
        footer?: any;
    } | undefined;
}>;
export type WhatsAppMessage = z.infer<typeof WhatsAppMessageSchema>;
export declare const WebhookPayloadSchema: z.ZodObject<{
    object: z.ZodLiteral<"whatsapp_business_account">;
    entry: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        changes: z.ZodArray<z.ZodObject<{
            value: z.ZodObject<{
                messaging_product: z.ZodLiteral<"whatsapp">;
                metadata: z.ZodObject<{
                    display_phone_number: z.ZodString;
                    phone_number_id: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    display_phone_number: string;
                    phone_number_id: string;
                }, {
                    display_phone_number: string;
                    phone_number_id: string;
                }>;
                contacts: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    profile: z.ZodObject<{
                        name: z.ZodString;
                    }, "strip", z.ZodTypeAny, {
                        name: string;
                    }, {
                        name: string;
                    }>;
                    wa_id: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    profile: {
                        name: string;
                    };
                    wa_id: string;
                }, {
                    profile: {
                        name: string;
                    };
                    wa_id: string;
                }>, "many">>;
                messages: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
            }, "strip", z.ZodTypeAny, {
                metadata: {
                    display_phone_number: string;
                    phone_number_id: string;
                };
                messaging_product: "whatsapp";
                messages?: any[] | undefined;
                contacts?: {
                    profile: {
                        name: string;
                    };
                    wa_id: string;
                }[] | undefined;
            }, {
                metadata: {
                    display_phone_number: string;
                    phone_number_id: string;
                };
                messaging_product: "whatsapp";
                messages?: any[] | undefined;
                contacts?: {
                    profile: {
                        name: string;
                    };
                    wa_id: string;
                }[] | undefined;
            }>;
            field: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            value: {
                metadata: {
                    display_phone_number: string;
                    phone_number_id: string;
                };
                messaging_product: "whatsapp";
                messages?: any[] | undefined;
                contacts?: {
                    profile: {
                        name: string;
                    };
                    wa_id: string;
                }[] | undefined;
            };
            field: string;
        }, {
            value: {
                metadata: {
                    display_phone_number: string;
                    phone_number_id: string;
                };
                messaging_product: "whatsapp";
                messages?: any[] | undefined;
                contacts?: {
                    profile: {
                        name: string;
                    };
                    wa_id: string;
                }[] | undefined;
            };
            field: string;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        id: string;
        changes: {
            value: {
                metadata: {
                    display_phone_number: string;
                    phone_number_id: string;
                };
                messaging_product: "whatsapp";
                messages?: any[] | undefined;
                contacts?: {
                    profile: {
                        name: string;
                    };
                    wa_id: string;
                }[] | undefined;
            };
            field: string;
        }[];
    }, {
        id: string;
        changes: {
            value: {
                metadata: {
                    display_phone_number: string;
                    phone_number_id: string;
                };
                messaging_product: "whatsapp";
                messages?: any[] | undefined;
                contacts?: {
                    profile: {
                        name: string;
                    };
                    wa_id: string;
                }[] | undefined;
            };
            field: string;
        }[];
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    object: "whatsapp_business_account";
    entry: {
        id: string;
        changes: {
            value: {
                metadata: {
                    display_phone_number: string;
                    phone_number_id: string;
                };
                messaging_product: "whatsapp";
                messages?: any[] | undefined;
                contacts?: {
                    profile: {
                        name: string;
                    };
                    wa_id: string;
                }[] | undefined;
            };
            field: string;
        }[];
    }[];
}, {
    object: "whatsapp_business_account";
    entry: {
        id: string;
        changes: {
            value: {
                metadata: {
                    display_phone_number: string;
                    phone_number_id: string;
                };
                messaging_product: "whatsapp";
                messages?: any[] | undefined;
                contacts?: {
                    profile: {
                        name: string;
                    };
                    wa_id: string;
                }[] | undefined;
            };
            field: string;
        }[];
    }[];
}>;
export type WebhookPayload = z.infer<typeof WebhookPayloadSchema>;
export declare const ConversationSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    merchantId: z.ZodString;
    customerId: z.ZodString;
    customerName: z.ZodOptional<z.ZodString>;
    customerPhone: z.ZodString;
    channel: z.ZodLiteral<"whatsapp">;
    status: z.ZodEnum<["active", "waiting", "resolved", "escalated"]>;
    context: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    lastMessageAt: z.ZodDate;
    messageCount: z.ZodDefault<z.ZodNumber>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    status: "active" | "escalated" | "resolved" | "waiting";
    tenantId: string;
    customerId: string;
    channel: "whatsapp";
    createdAt: Date;
    updatedAt: Date;
    merchantId: string;
    customerPhone: string;
    lastMessageAt: Date;
    messageCount: number;
    context?: Record<string, any> | undefined;
    customerName?: string | undefined;
}, {
    id: string;
    status: "active" | "escalated" | "resolved" | "waiting";
    tenantId: string;
    customerId: string;
    channel: "whatsapp";
    createdAt: Date;
    updatedAt: Date;
    merchantId: string;
    customerPhone: string;
    lastMessageAt: Date;
    context?: Record<string, any> | undefined;
    customerName?: string | undefined;
    messageCount?: number | undefined;
}>;
export type Conversation = z.infer<typeof ConversationSchema>;
export declare const MessageSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    merchantId: z.ZodString;
    conversationId: z.ZodString;
    messageId: z.ZodString;
    direction: z.ZodEnum<["inbound", "outbound"]>;
    role: z.ZodEnum<["user", "assistant", "system"]>;
    content: z.ZodString;
    type: z.ZodEnum<["text", "image", "document", "audio", "video", "template", "button", "location"]>;
    mediaUrl: z.ZodOptional<z.ZodString>;
    intent: z.ZodOptional<z.ZodString>;
    confidence: z.ZodOptional<z.ZodNumber>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "text" | "image" | "document" | "video" | "audio" | "location" | "template" | "button";
    tenantId: string;
    conversationId: string;
    role: "system" | "user" | "assistant";
    createdAt: Date;
    content: string;
    direction: "inbound" | "outbound";
    messageId: string;
    merchantId: string;
    intent?: string | undefined;
    confidence?: number | undefined;
    metadata?: Record<string, any> | undefined;
    mediaUrl?: string | undefined;
}, {
    id: string;
    type: "text" | "image" | "document" | "video" | "audio" | "location" | "template" | "button";
    tenantId: string;
    conversationId: string;
    role: "system" | "user" | "assistant";
    createdAt: Date;
    content: string;
    direction: "inbound" | "outbound";
    messageId: string;
    merchantId: string;
    intent?: string | undefined;
    confidence?: number | undefined;
    metadata?: Record<string, any> | undefined;
    mediaUrl?: string | undefined;
}>;
export type Message = z.infer<typeof MessageSchema>;
export declare const BusinessProfileSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    merchantId: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    category: z.ZodString;
    address: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    website: z.ZodOptional<z.ZodString>;
    timezone: z.ZodDefault<z.ZodString>;
    language: z.ZodDefault<z.ZodString>;
    businessHours: z.ZodOptional<z.ZodObject<{
        monday: z.ZodOptional<z.ZodObject<{
            open: z.ZodString;
            close: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            close: string;
            open: string;
        }, {
            close: string;
            open: string;
        }>>;
        tuesday: z.ZodOptional<z.ZodObject<{
            open: z.ZodString;
            close: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            close: string;
            open: string;
        }, {
            close: string;
            open: string;
        }>>;
        wednesday: z.ZodOptional<z.ZodObject<{
            open: z.ZodString;
            close: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            close: string;
            open: string;
        }, {
            close: string;
            open: string;
        }>>;
        thursday: z.ZodOptional<z.ZodObject<{
            open: z.ZodString;
            close: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            close: string;
            open: string;
        }, {
            close: string;
            open: string;
        }>>;
        friday: z.ZodOptional<z.ZodObject<{
            open: z.ZodString;
            close: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            close: string;
            open: string;
        }, {
            close: string;
            open: string;
        }>>;
        saturday: z.ZodOptional<z.ZodObject<{
            open: z.ZodString;
            close: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            close: string;
            open: string;
        }, {
            close: string;
            open: string;
        }>>;
        sunday: z.ZodOptional<z.ZodObject<{
            open: z.ZodString;
            close: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            close: string;
            open: string;
        }, {
            close: string;
            open: string;
        }>>;
    }, "strip", z.ZodTypeAny, {
        monday?: {
            close: string;
            open: string;
        } | undefined;
        tuesday?: {
            close: string;
            open: string;
        } | undefined;
        wednesday?: {
            close: string;
            open: string;
        } | undefined;
        thursday?: {
            close: string;
            open: string;
        } | undefined;
        friday?: {
            close: string;
            open: string;
        } | undefined;
        saturday?: {
            close: string;
            open: string;
        } | undefined;
        sunday?: {
            close: string;
            open: string;
        } | undefined;
    }, {
        monday?: {
            close: string;
            open: string;
        } | undefined;
        tuesday?: {
            close: string;
            open: string;
        } | undefined;
        wednesday?: {
            close: string;
            open: string;
        } | undefined;
        thursday?: {
            close: string;
            open: string;
        } | undefined;
        friday?: {
            close: string;
            open: string;
        } | undefined;
        saturday?: {
            close: string;
            open: string;
        } | undefined;
        sunday?: {
            close: string;
            open: string;
        } | undefined;
    }>>;
    features: z.ZodObject<{
        ordering: z.ZodDefault<z.ZodBoolean>;
        booking: z.ZodDefault<z.ZodBoolean>;
        support: z.ZodDefault<z.ZodBoolean>;
        catalog: z.ZodDefault<z.ZodBoolean>;
        feedback: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        support: boolean;
        booking: boolean;
        feedback: boolean;
        ordering: boolean;
        catalog: boolean;
    }, {
        support?: boolean | undefined;
        booking?: boolean | undefined;
        feedback?: boolean | undefined;
        ordering?: boolean | undefined;
        catalog?: boolean | undefined;
    }>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    tenantId: string;
    language: string;
    category: string;
    features: {
        support: boolean;
        booking: boolean;
        feedback: boolean;
        ordering: boolean;
        catalog: boolean;
    };
    description: string;
    createdAt: Date;
    updatedAt: Date;
    timezone: string;
    merchantId: string;
    email?: string | undefined;
    address?: string | undefined;
    website?: string | undefined;
    businessHours?: {
        monday?: {
            close: string;
            open: string;
        } | undefined;
        tuesday?: {
            close: string;
            open: string;
        } | undefined;
        wednesday?: {
            close: string;
            open: string;
        } | undefined;
        thursday?: {
            close: string;
            open: string;
        } | undefined;
        friday?: {
            close: string;
            open: string;
        } | undefined;
        saturday?: {
            close: string;
            open: string;
        } | undefined;
        sunday?: {
            close: string;
            open: string;
        } | undefined;
    } | undefined;
}, {
    id: string;
    name: string;
    tenantId: string;
    category: string;
    features: {
        support?: boolean | undefined;
        booking?: boolean | undefined;
        feedback?: boolean | undefined;
        ordering?: boolean | undefined;
        catalog?: boolean | undefined;
    };
    description: string;
    createdAt: Date;
    updatedAt: Date;
    merchantId: string;
    email?: string | undefined;
    address?: string | undefined;
    language?: string | undefined;
    website?: string | undefined;
    timezone?: string | undefined;
    businessHours?: {
        monday?: {
            close: string;
            open: string;
        } | undefined;
        tuesday?: {
            close: string;
            open: string;
        } | undefined;
        wednesday?: {
            close: string;
            open: string;
        } | undefined;
        thursday?: {
            close: string;
            open: string;
        } | undefined;
        friday?: {
            close: string;
            open: string;
        } | undefined;
        saturday?: {
            close: string;
            open: string;
        } | undefined;
        sunday?: {
            close: string;
            open: string;
        } | undefined;
    } | undefined;
}>;
export type BusinessProfile = z.infer<typeof BusinessProfileSchema>;
export declare const KnowledgeBaseItemSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    merchantId: z.ZodString;
    category: z.ZodString;
    question: z.ZodString;
    answer: z.ZodString;
    keywords: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    intents: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    confidence: z.ZodDefault<z.ZodNumber>;
    usageCount: z.ZodDefault<z.ZodNumber>;
    helpfulCount: z.ZodDefault<z.ZodNumber>;
    notHelpfulCount: z.ZodDefault<z.ZodNumber>;
    active: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    active: boolean;
    id: string;
    tenantId: string;
    category: string;
    confidence: number;
    createdAt: Date;
    updatedAt: Date;
    merchantId: string;
    question: string;
    answer: string;
    usageCount: number;
    helpfulCount: number;
    notHelpfulCount: number;
    keywords?: string[] | undefined;
    intents?: string[] | undefined;
}, {
    id: string;
    tenantId: string;
    category: string;
    createdAt: Date;
    updatedAt: Date;
    merchantId: string;
    question: string;
    answer: string;
    active?: boolean | undefined;
    confidence?: number | undefined;
    keywords?: string[] | undefined;
    intents?: string[] | undefined;
    usageCount?: number | undefined;
    helpfulCount?: number | undefined;
    notHelpfulCount?: number | undefined;
}>;
export type KnowledgeBaseItem = z.infer<typeof KnowledgeBaseItemSchema>;
export declare const AutomationRuleSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    merchantId: z.ZodString;
    name: z.ZodString;
    trigger: z.ZodObject<{
        type: z.ZodEnum<["keyword", "intent", "time", "event", " inactivity"]>;
        config: z.ZodRecord<z.ZodString, z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        type: "intent" | "event" | "keyword" | "time" | " inactivity";
        config: Record<string, any>;
    }, {
        type: "intent" | "event" | "keyword" | "time" | " inactivity";
        config: Record<string, any>;
    }>;
    conditions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        field: z.ZodString;
        operator: z.ZodEnum<["equals", "contains", "greater_than", "less_than"]>;
        value: z.ZodAny;
    }, "strip", z.ZodTypeAny, {
        field: string;
        operator: "contains" | "equals" | "greater_than" | "less_than";
        value?: any;
    }, {
        field: string;
        operator: "contains" | "equals" | "greater_than" | "less_than";
        value?: any;
    }>, "many">>;
    actions: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["reply", "template", "tag", "assign", "webhook", "workflow"]>;
        config: z.ZodRecord<z.ZodString, z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        type: "workflow" | "template" | "tag" | "assign" | "reply" | "webhook";
        config: Record<string, any>;
    }, {
        type: "workflow" | "template" | "tag" | "assign" | "reply" | "webhook";
        config: Record<string, any>;
    }>, "many">;
    priority: z.ZodDefault<z.ZodNumber>;
    active: z.ZodDefault<z.ZodBoolean>;
    stats: z.ZodOptional<z.ZodObject<{
        triggers: z.ZodDefault<z.ZodNumber>;
        success: z.ZodDefault<z.ZodNumber>;
        failures: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        success: number;
        triggers: number;
        failures: number;
    }, {
        success?: number | undefined;
        triggers?: number | undefined;
        failures?: number | undefined;
    }>>;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    active: boolean;
    id: string;
    name: string;
    tenantId: string;
    trigger: {
        type: "intent" | "event" | "keyword" | "time" | " inactivity";
        config: Record<string, any>;
    };
    createdAt: Date;
    actions: {
        type: "workflow" | "template" | "tag" | "assign" | "reply" | "webhook";
        config: Record<string, any>;
    }[];
    priority: number;
    merchantId: string;
    stats?: {
        success: number;
        triggers: number;
        failures: number;
    } | undefined;
    conditions?: {
        field: string;
        operator: "contains" | "equals" | "greater_than" | "less_than";
        value?: any;
    }[] | undefined;
}, {
    id: string;
    name: string;
    tenantId: string;
    trigger: {
        type: "intent" | "event" | "keyword" | "time" | " inactivity";
        config: Record<string, any>;
    };
    createdAt: Date;
    actions: {
        type: "workflow" | "template" | "tag" | "assign" | "reply" | "webhook";
        config: Record<string, any>;
    }[];
    merchantId: string;
    active?: boolean | undefined;
    stats?: {
        success?: number | undefined;
        triggers?: number | undefined;
        failures?: number | undefined;
    } | undefined;
    priority?: number | undefined;
    conditions?: {
        field: string;
        operator: "contains" | "equals" | "greater_than" | "less_than";
        value?: any;
    }[] | undefined;
}>;
export type AutomationRule = z.infer<typeof AutomationRuleSchema>;
//# sourceMappingURL=index.d.ts.map
import { Router, Request, Response } from 'express'
import { flagService } from './flagService.js'
import { CreateFlagSchema, UpdateFlagSchema, AddVariationSchema, AddTargetingRuleSchema, EvaluateContextSchema } from './types.js'

const router = Router()

// ─────────────────────────────────────────────────────────────────────────────
// FLAGS CRUD
// ─────────────────────────────────────────────────────────────────────────────

// POST /flags - Create flag
router.post('/flags', async (req: Request, res: Response) => {
  try {
    const parseResult = CreateFlagSchema.safeParse(req.body)
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parseResult.error.issues,
      })
    }

    const flag = flagService.createFlag(parseResult.data, req.headers['x-user-id'] as string)

    return res.status(201).json({
      success: true,
      data: flag,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return res.status(400).json({
      success: false,
      error: message,
    })
  }
})

// GET /flags - List flags
router.get('/flags', (req: Request, res: Response) => {
  const { status, tags, search } = req.query

  const flags = flagService.listFlags({
    status: status as string,
    tags: tags ? (tags as string).split(',') : undefined,
    search: search as string,
  })

  return res.json({
    success: true,
    data: flags,
  })
})

// GET /flags/:key - Get flag
router.get('/flags/:key', (req: Request, res: Response) => {
  const flag = flagService.getFlag(req.params.key)

  if (!flag) {
    return res.status(404).json({
      success: false,
      error: 'Flag not found',
    })
  }

  return res.json({
    success: true,
    data: flag,
  })
})

// PATCH /flags/:key - Update flag
router.patch('/flags/:key', (req: Request, res: Response) => {
  try {
    const parseResult = UpdateFlagSchema.safeParse(req.body)
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parseResult.error.issues,
      })
    }

    const flag = flagService.updateFlag(
      req.params.key,
      parseResult.data,
      req.headers['x-user-id'] as string
    )

    return res.json({
      success: true,
      data: flag,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return res.status(400).json({
      success: false,
      error: message,
    })
  }
})

// DELETE /flags/:key - Archive flag
router.delete('/flags/:key', (req: Request, res: Response) => {
  const deleted = flagService.archiveFlag(req.params.key, req.headers['x-user-id'] as string)

  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: 'Flag not found',
    })
  }

  return res.json({
    success: true,
    message: 'Flag archived',
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// VARIATIONS
// ─────────────────────────────────────────────────────────────────────────────

// POST /flags/:key/variations - Add variation
router.post('/flags/:key/variations', (req: Request, res: Response) => {
  try {
    const parseResult = AddVariationSchema.safeParse(req.body)
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parseResult.error.issues,
      })
    }

    const flag = flagService.addVariation(req.params.key, parseResult.data)

    return res.status(201).json({
      success: true,
      data: flag,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return res.status(400).json({
      success: false,
      error: message,
    })
  }
})

// DELETE /flags/:key/variations/:variationKey - Remove variation
router.delete('/flags/:key/variations/:variationKey', (req: Request, res: Response) => {
  try {
    const flag = flagService.removeVariation(req.params.key, req.params.variationKey)

    return res.json({
      success: true,
      data: flag,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return res.status(400).json({
      success: false,
      error: message,
    })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// TARGETING RULES
// ─────────────────────────────────────────────────────────────────────────────

// POST /flags/:key/rules - Add targeting rule
router.post('/flags/:key/rules', (req: Request, res: Response) => {
  try {
    const parseResult = AddTargetingRuleSchema.safeParse(req.body)
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parseResult.error.issues,
      })
    }

    const flag = flagService.addTargetingRule(req.params.key, parseResult.data)

    return res.status(201).json({
      success: true,
      data: flag,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return res.status(400).json({
      success: false,
      error: message,
    })
  }
})

// PATCH /flags/:key/rules/:ruleId - Update targeting rule
router.patch('/flags/:key/rules/:ruleId', (req: Request, res: Response) => {
  try {
    const flag = flagService.updateTargetingRule(req.params.key, req.params.ruleId, req.body)

    return res.json({
      success: true,
      data: flag,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return res.status(400).json({
      success: false,
      error: message,
    })
  }
})

// DELETE /flags/:key/rules/:ruleId - Remove targeting rule
router.delete('/flags/:key/rules/:ruleId', (req: Request, res: Response) => {
  try {
    const flag = flagService.removeTargetingRule(req.params.key, req.params.ruleId)

    return res.json({
      success: true,
      data: flag,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return res.status(400).json({
      success: false,
      error: message,
    })
  }
})

// POST /flags/:key/rules/reorder - Reorder rules
router.post('/flags/:key/rules/reorder', (req: Request, res: Response) => {
  try {
    const { ruleIds } = req.body

    if (!Array.isArray(ruleIds)) {
      return res.status(400).json({
        success: false,
        error: 'ruleIds must be an array',
      })
    }

    const flag = flagService.reorderTargetingRules(req.params.key, ruleIds)

    return res.json({
      success: true,
      data: flag,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return res.status(400).json({
      success: false,
      error: message,
    })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// EVALUATION
// ─────────────────────────────────────────────────────────────────────────────

// POST /evaluate - Evaluate single flag
router.post('/evaluate/:key', (req: Request, res: Response) => {
  const parseResult = EvaluateContextSchema.safeParse(req.body)

  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: 'Invalid context',
      details: parseResult.error.issues,
    })
  }

  const result = flagService.evaluate(req.params.key, parseResult.data)

  return res.json({
    success: true,
    data: result,
  })
})

// POST /evaluate/batch - Evaluate multiple flags
router.post('/evaluate/batch', (req: Request, res: Response) => {
  const { flagKeys, context } = req.body

  if (!Array.isArray(flagKeys)) {
    return res.status(400).json({
      success: false,
      error: 'flagKeys must be an array',
    })
  }

  const parseResult = EvaluateContextSchema.safeParse(context || {})
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: 'Invalid context',
    })
  }

  const results = flagService.evaluateMany(flagKeys, parseResult.data)

  return res.json({
    success: true,
    data: {
      results,
      contextId: context?.userId || context?.anonymousId || 'anonymous',
      evaluatedAt: new Date().toISOString(),
    },
  })
})

// POST /evaluate/all - Evaluate all active flags
router.post('/evaluate/all', (req: Request, res: Response) => {
  const parseResult = EvaluateContextSchema.safeParse(req.body || {})

  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: 'Invalid context',
    })
  }

  const results = flagService.evaluateAll(parseResult.data)

  return res.json({
    success: true,
    data: {
      results,
      contextId: parseResult.data.userId || parseResult.data.anonymousId || 'anonymous',
      evaluatedAt: new Date().toISOString(),
    },
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SDK ENDPOINTS (Simplified for client-side usage)
// ─────────────────────────────────────────────────────────────────────────────

// GET /sdk/flags - Get all flag configs for SDK
router.get('/sdk/flags', (req: Request, res: Response) => {
  const { userId, anonymousId } = req.query

  const context: unknown = {}
  if (userId) context.userId = userId
  if (anonymousId) context.anonymousId = anonymousId

  const results = flagService.evaluateAll(context)

  // Format for SDK
  const sdkFlags: Record<string, { variations: Record<string, unknown>; defaultVariation: string }> = {}

  results.forEach(r => {
    const flag = flagService.getFlag(r.flagKey)
    if (flag) {
      sdkFlags[r.flagKey] = {
        variations: Object.fromEntries(
          flag.variations.map(v => [v.key, v.value])
        ),
        defaultVariation: flag.defaultVariation,
      }
    }
  })

  return res.json(sdkFlags)
})

// GET /sdk/flags/:key - Get single flag for SDK
router.get('/sdk/flags/:key', (req: Request, res: Response) => {
  const { userId, anonymousId } = req.query
  const flag = flagService.getFlag(req.params.key)

  if (!flag) {
    return res.status(404).json({ error: 'Flag not found' })
  }

  const context: unknown = {}
  if (userId) context.userId = userId
  if (anonymousId) context.anonymousId = anonymousId

  const result = flagService.evaluate(req.params.key, context)

  return res.json({
    [req.params.key]: {
      variations: Object.fromEntries(
        flag.variations.map(v => [v.key, v.value])
      ),
      defaultVariation: flag.defaultVariation,
    },
    // Also include the evaluated value for convenience
    _value: result.value,
    _reason: result.reason,
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// HISTORY
// ─────────────────────────────────────────────────────────────────────────────

// GET /flags/:key/history - Get flag change history
router.get('/flags/:key/history', (req: Request, res: Response) => {
  const history = flagService.getHistory(req.params.key, parseInt(req.query.limit as string) || 50)

  return res.json({
    success: true,
    data: history,
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SEGMENTS
// ─────────────────────────────────────────────────────────────────────────────

// GET /segments - List segments
router.get('/segments', (req: Request, res: Response) => {
  const segments = flagService.listSegments()

  return res.json({
    success: true,
    data: segments,
  })
})

// POST /segments - Create segment
router.post('/segments', (req: Request, res: Response) => {
  const segment = flagService.createSegment(req.body)

  return res.status(201).json({
    success: true,
    data: segment,
  })
})

// GET /segments/:id - Get segment
router.get('/segments/:id', (req: Request, res: Response) => {
  const segment = flagService.getSegment(req.params.id)

  if (!segment) {
    return res.status(404).json({
      success: false,
      error: 'Segment not found',
    })
  }

  return res.json({
    success: true,
    data: segment,
  })
})

// DELETE /segments/:id - Delete segment
router.delete('/segments/:id', (req: Request, res: Response) => {
  const deleted = flagService.deleteSegment(req.params.id)

  return res.json({
    success: deleted,
  })
})

export default router

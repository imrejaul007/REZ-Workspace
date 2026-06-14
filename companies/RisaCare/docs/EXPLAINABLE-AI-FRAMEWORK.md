# RisaCare Explainable AI Framework

**Version:** 1.0.0  
**Date:** June 4, 2026  
**Owner:** AI Governance Board

---

## Overview

This framework establishes how RisaCare implements explainability across all AI systems. Explainability is not optional—it is a core requirement for building trust in healthcare AI.

---

## Why Explainability Matters

### Clinical Trust
- Clinicians need to understand why AI makes recommendations
- Blind trust in AI is dangerous; informed trust improves outcomes
- Explanations enable clinicians to validate or override AI decisions

### Patient Autonomy
- Patients have the right to understand AI decisions affecting their care
- Informed consent requires understanding of AI's role
- Explanations enable shared decision-making

### Regulatory Compliance
- HIPAA requires explanation for automated decisions
- FDA guidance on AI/ML-based software requires transparency
- Audit requirements need decision trails

### Liability & Accountability
- Clear explanations support defensible decisions
- Root cause analysis requires understanding
- Accountability requires traceability

---

## Explanation Types

### 1. Feature Attribution Explanations

**What:** Which input features contributed most to the prediction?

**Example:**
```
Diagnosis Suggestion: Diabetes Type 2 (87% confidence)

Key Contributing Factors:
1. HbA1c level (8.2%) - Strong contribution (+45%)
2. Fasting blood glucose (142 mg/dL) - Strong contribution (+30%)
3. Family history of diabetes - Moderate contribution (+15%)
4. BMI (28.5) - Moderate contribution (+10%)

Based on similar patient profiles with confirmed diagnoses.
```

**Implementation:** SHAP values, LIME, Integrated Gradients

### 2. Counterfactual Explanations

**What:** What would need to change for a different outcome?

**Example:**
```
Risk Assessment: High cardiovascular risk

To reduce risk to moderate:
• Lower LDL cholesterol from 165 to <130 mg/dL
• Increase physical activity to 150 min/week
• Reduce BMI from 32 to <30

These changes would reduce your 10-year risk by approximately 15%.
```

**Implementation:** Counterfactual instance generation, rule extraction

### 3. Rule-Based Explanations

**What:** What decision rules did the model learn?

**Example:**
```
Prescription Recommendation: Metformin 500mg twice daily

Based on clinical guidelines and similar cases:

IF:
  - HbA1c 7.0-8.5%
  - No contraindications
  - Normal kidney function
THEN:
  - Start Metformin 500mg twice daily with meals
  - Recheck HbA1c in 3 months

Clinical Rationale: First-line therapy per ADA guidelines for Type 2 DM
```

**Implementation:** Decision tree extraction, rule mining

### 4. Similar Case Explanations

**What:** What similar cases led to what outcomes?

**Example:**
```
Treatment Recommendation: Conservative management

Based on analysis of 847 similar cases:

Similar Patient Profile:
- 55-year-old male
- HbA1c: 7.8%
- No complications
- BMI: 29
- Lifestyle: sedentary

Outcomes in Similar Cases:
- 72% managed successfully with lifestyle + Metformin
- 18% required additional medication
- 10% progressed to insulin

Average time to target HbA1c: 6 months
```

**Implementation:** Nearest neighbor analysis, case-based reasoning

### 5. Uncertainty Quantification

**What:** How confident is the AI in this prediction?

**Example:**
```
Lab Result Analysis

Finding: Possible abnormality in left lung X-ray

Confidence Level: MODERATE (68%)

Confidence Breakdown:
- AI confidence: 72%
- Evidence strength: Moderate
- Similar cases: 23
- Data quality: Good

Uncertainty Sources:
- Image quality slightly reduced
- Rare presentation (12 similar cases in database)

Recommendation: Review by radiologist recommended
```

**Implementation:** Bayesian uncertainty, ensemble disagreement, conformal prediction

---

## Explanation Generation Pipeline

```
User Query
     │
     ▼
┌─────────────────────────────────────────┐
│          AI Inference Engine              │
└─────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│     Explanation Generation Layer          │
├─────────────────────────────────────────┤
│  • Feature Attribution (SHAP/LIME)       │
│  • Counterfactual Generation             │
│  • Rule Extraction                      │
│  • Similar Case Retrieval               │
│  • Uncertainty Quantification           │
└─────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│       Explanation Template Engine         │
└─────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│      Natural Language Generation          │
└─────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│         User-Appropriate Output           │
│  • Clinical detail level                │
│  • Patient-friendly language            │
│  • Visual explanations                  │
└─────────────────────────────────────────┘
```

---

## Implementation Guidelines

### For Every AI Output

1. **Primary Message:** What is the AI recommending?
2. **Confidence Level:** How sure is the AI? (Low/Medium/High/Very High)
3. **Key Factors:** What drove this recommendation?
4. **Alternative Views:** What else should be considered?
5. **Uncertainty Sources:** What might make this wrong?
6. **Human Review Needed:** Is clinician verification required?

### Confidence Level Definitions

| Level | Range | Meaning |
|-------|-------|---------|
| Very High | 95-100% | Highly confident, rare exceptions |
| High | 80-94% | Confident, some variation expected |
| Medium | 60-79% | Moderate confidence, review recommended |
| Low | 40-59% | Uncertain, clinician review required |
| Very Low | <40% | Highly uncertain, proceed with caution |

### Explanation Depth by Use Case

| Use Case | Minimum Depth |
|----------|--------------|
| Informational | Basic summary |
| Routing/Triage | Feature attribution |
| Diagnosis Support | Full explanation with confidence |
| Treatment Recommendations | Full explanation + alternatives |
| Risk Scoring | Full explanation + mitigation options |
| Critical Decisions | Full explanation + similar cases + uncertainty |

---

## Technical Implementation

### SHAP Explanations

```typescript
interface SHAPExplanation {
  baseValue: number;
  featureValues: {
    feature: string;
    value: number;
    shapValue: number;
    contribution: number; // percentage
  }[];
  outputValue: number;
  confidence: 'low' | 'medium' | 'high' | 'very_high';
}
```

### Natural Language Templates

```typescript
interface ExplanationTemplate {
  type: 'diagnosis' | 'treatment' | 'risk' | 'routing';
  clinicianTemplate: string; // Detailed clinical explanation
  patientTemplate: string;   // Simplified patient explanation
  requiredFields: string[]; // Fields needed for this template
  confidenceThreshold: number;
}
```

### Example Implementation

```typescript
function generateExplanation(
  prediction: AIPrediction,
  model: AIModel,
  patientData: PatientData
): Explanation {
  // 1. Get SHAP values
  const shapValues = explainWithSHAP(model, patientData);
  
  // 2. Get counterfactuals
  const counterfactuals = generateCounterfactuals(model, patientData);
  
  // 3. Get similar cases
  const similarCases = findSimilarCases(patientData, prediction.type);
  
  // 4. Calculate uncertainty
  const uncertainty = quantifyUncertainty(model, patientData);
  
  // 5. Generate natural language
  return {
    summary: generateSummary(prediction, shapValues),
    featureAttribution: shapValues,
    counterfactuals: counterfactuals,
    similarCases: similarCases,
    uncertainty: uncertainty,
    confidence: calculateConfidence(uncertainty, shapValues),
    recommendedActions: generateRecommendations(prediction, similarCases)
  };
}
```

---

## User-Specific Explanations

### Clinician View
- Technical details of model decision
- Statistical confidence intervals
- Relevant medical literature
- Ability to drill down into factors

### Patient View
- Simple, jargon-free language
- Visual aids (charts, icons)
- Actionable next steps
- What to discuss with doctor

### Administrator View
- Aggregate pattern explanations
- System-level insights
- Compliance documentation

---

## Quality Standards

### Explanation Quality Checklist

- [ ] Is the explanation accurate? (Matches model behavior)
- [ ] Is it consistent? (Same input = same explanation)
- [ ] Is it complete? (All key factors included)
- [ ] Is it understandable? (Appropriate for audience)
- [ ] Is it actionable? (User knows what to do)
- [ ] Is it honest? (Acknowledges uncertainty)

### Testing Requirements

1. **Unit Tests:** Each explanation component tested independently
2. **Integration Tests:** Full explanation pipeline validated
3. **Human Evaluation:** Clinicians assess explanation quality
4. **User Studies:** Feedback on explanation usefulness
5. **Adversarial Testing:** Ensure explanations aren't misleading

---

## Audit & Compliance

### Required Documentation

For every AI decision that affects patient care:

```typescript
interface AIDecisionAudit {
  decisionId: string;
  timestamp: Date;
  userId: string;
  patientId: string;
  aiSystemId: string;
  inputFeatures: Record<string, any>;
  output: AIPrediction;
  explanation: Explanation;
  confidence: number;
  humanReviewed: boolean;
  humanOverride?: {
    overridden: boolean;
    reason?: string;
    clinicianId?: string;
  };
}
```

### Audit Trail Requirements

- All AI decisions logged with full context
- Explanations preserved with decisions
- Human reviews documented
- Overrides and reasons captured
- Retention: Minimum 7 years

---

## Example Explanations by Use Case

### 1. Diagnosis Suggestion

```
┌─────────────────────────────────────────────────────────────┐
│ AI Diagnosis Suggestion                                     │
├─────────────────────────────────────────────────────────────┤
│ Possible Diagnosis: Acute Bronchitis                       │
│ Confidence: HIGH (82%)                                    │
│                                                             │
│ Key Indicators:                                            │
│  • Cough (5 days) - Moderate contribution                  │
│  • Slight fever (100.4°F) - Moderate contribution         │
│  • No consolidation on X-ray - Reduces pneumonia likelihood │
│  • Clear lung sounds - Supports viral etiology             │
│                                                             │
│ Ruling Out:                                                 │
│  • Pneumonia: X-ray clear, no high fever                   │
│  • COVID-19: No typical COVID symptoms                     │
│                                                             │
│ Recommended Next Steps:                                     │
│  1. Symptomatic treatment (rest, fluids, OTC remedies)    │
│  2. Return if symptoms worsen or persist >10 days          │
│  3. Consider COVID test if new exposures                    │
│                                                             │
│ ⚠️ This is a suggestion. Clinical judgment required.       │
│    Human Review: Required before treatment decisions        │
└─────────────────────────────────────────────────────────────┘
```

### 2. Risk Assessment

```
┌─────────────────────────────────────────────────────────────┐
│ Cardiovascular Risk Assessment                              │
├─────────────────────────────────────────────────────────────┤
│ 10-Year Risk: MODERATE (12%)                              │
│ Confidence: HIGH (88%)                                     │
│                                                             │
│ Risk Breakdown:                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Factor          │ Your Value  │ Target      │ Impact   │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ LDL Cholesterol │ 165 mg/dL   │ <130 mg/dL  │ HIGH     │ │
│ │ Blood Pressure │ 135/85      │ <130/80     │ MODERATE │ │
│ │ BMI            │ 29          │ <25         │ MODERATE │ │
│ │ Smoking        │ Non-smoker  │ -           │ LOW      │ │
│ │ Exercise       │ 1x/week     │ 3x/week     │ MODERATE │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ What Would Lower Your Risk:                                 │
│  • Lower LDL to 130: Reduces risk by ~3%                   │
│  • Increase exercise: Reduces risk by ~2%                  │
│  • Combined lifestyle changes: Reduces risk by ~5%         │
│                                                             │
│ Based on analysis of 12,500 similar patient profiles.       │
└─────────────────────────────────────────────────────────────┘
```

### 3. Medication Recommendation

```
┌─────────────────────────────────────────────────────────────┐
│ Medication Recommendation                                  │
├─────────────────────────────────────────────────────────────┤
│ Recommended: Metformin 500mg twice daily                   │
│ Confidence: VERY HIGH (95%)                                │
│                                                             │
│ Why This Medication:                                         │
│  • First-line treatment per diabetes guidelines             │
│  • Your HbA1c (7.8%) indicates diet/exercise insufficient │
│  • No contraindications (normal kidney function)           │
│  • Well-tolerated with few side effects                    │
│                                                             │
│ Alternative Options:                                        │
│  • Metformin ER (once daily, potentially fewer GI issues)   │
│  • Add second medication if HbA1c > 8.5% in 3 months      │
│                                                             │
│ What to Monitor:                                            │
│  • Blood sugar daily until stable                          │
│  • HbA1c every 3 months                                     │
│  • Kidney function annually                                 │
│                                                             │
│ Side Effects (rare):                                        │
│  • Nausea (usually resolves in 2 weeks)                     │
│  • Take with food to reduce GI symptoms                     │
│                                                             │
│ ⚠️ Prescribing clinician review required                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Continuous Improvement

### Metrics We Track

| Metric | Target |
|--------|--------|
| Explanation coverage | 100% of AI outputs |
| Clinician comprehension score | > 85% |
| Patient comprehension score | > 75% |
| Override rate | Monitored, not penalized |
| Explanation generation time | < 500ms |
| User satisfaction with explanations | > 4/5 |

### Feedback Loop

```
User Feedback
     │
     ▼
┌─────────────────────────────────────────┐
│      Explanation Quality Analysis         │
└─────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│      Improvement Recommendations          │
└─────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│      Framework Updates (Quarterly)        │
└─────────────────────────────────────────┘
```

---

**Version History:**
- v1.0.0 (June 4, 2026) - Initial release

**Related Documents:**
- [AI-SAFETY-CHARTER.md](AI-SAFETY-CHARTER.md)
- [HEALTH-AI.md](HEALTH-AI.md)
- [SECURITY.md](SECURITY.md)

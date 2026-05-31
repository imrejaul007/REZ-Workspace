"use strict";
/**
 * HR Recruiter Agent - Type Definitions
 * AI-powered candidate screening, interview scheduling, and onboarding
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalaryCurrency = exports.EmploymentType = exports.ExperienceLevel = exports.OnboardingStatus = exports.InterviewStatus = exports.InterviewType = exports.CandidateStatus = void 0;
// ============================================
// ENUMS
// ============================================
var CandidateStatus;
(function (CandidateStatus) {
    CandidateStatus["NEW"] = "new";
    CandidateStatus["SCREENING"] = "screening";
    CandidateStatus["QUALIFIED"] = "qualified";
    CandidateStatus["INTERVIEWING"] = "interviewing";
    CandidateStatus["OFFERED"] = "offered";
    CandidateStatus["HIRED"] = "hired";
    CandidateStatus["REJECTED"] = "rejected";
    CandidateStatus["WITHDRAWN"] = "withdrawn";
})(CandidateStatus || (exports.CandidateStatus = CandidateStatus = {}));
var InterviewType;
(function (InterviewType) {
    InterviewType["PHONE_SCREEN"] = "phone_screen";
    InterviewType["TECHNICAL"] = "technical";
    InterviewType["BEHAVIORAL"] = "behavioral";
    InterviewType["CULTURE_FIT"] = "culture_fit";
    InterviewType["FINAL_ROUND"] = "final_round";
    InterviewType["PANEL"] = "panel";
})(InterviewType || (exports.InterviewType = InterviewType = {}));
var InterviewStatus;
(function (InterviewStatus) {
    InterviewStatus["SCHEDULED"] = "scheduled";
    InterviewStatus["CONFIRMED"] = "confirmed";
    InterviewStatus["COMPLETED"] = "completed";
    InterviewStatus["CANCELLED"] = "cancelled";
    InterviewStatus["NO_SHOW"] = "no_show";
    InterviewStatus["RESCHEDULED"] = "rescheduled";
})(InterviewStatus || (exports.InterviewStatus = InterviewStatus = {}));
var OnboardingStatus;
(function (OnboardingStatus) {
    OnboardingStatus["NOT_STARTED"] = "not_started";
    OnboardingStatus["DOCUMENTS_PENDING"] = "documents_pending";
    OnboardingStatus["DOCUMENTS_COMPLETED"] = "documents_completed";
    OnboardingStatus["TRAINING_PENDING"] = "training_pending";
    OnboardingStatus["TRAINING_COMPLETED"] = "training_complete";
    OnboardingStatus["EQUIPMENT_PENDING"] = "equipment_pending";
    OnboardingStatus["EQUIPMENT_PROVIDED"] = "equipment_provided";
    OnboardingStatus["COMPLETED"] = "completed";
    OnboardingStatus["FAILED"] = "failed";
})(OnboardingStatus || (exports.OnboardingStatus = OnboardingStatus = {}));
var ExperienceLevel;
(function (ExperienceLevel) {
    ExperienceLevel["FRESHER"] = "fresher";
    ExperienceLevel["JUNIOR"] = "junior";
    ExperienceLevel["MIDDLE"] = "middle";
    ExperienceLevel["SENIOR"] = "senior";
    ExperienceLevel["LEAD"] = "lead";
    ExperienceLevel["PRINCIPAL"] = "principal";
    ExperienceLevel["DIRECTOR"] = "director";
    ExperienceLevel["VP"] = "vp";
})(ExperienceLevel || (exports.ExperienceLevel = ExperienceLevel = {}));
var EmploymentType;
(function (EmploymentType) {
    EmploymentType["FULL_TIME"] = "full_time";
    EmploymentType["PART_TIME"] = "part_time";
    EmploymentType["CONTRACT"] = "contract";
    EmploymentType["INTERNSHIP"] = "internship";
    EmploymentType["TEMPORARY"] = "temporary";
})(EmploymentType || (exports.EmploymentType = EmploymentType = {}));
var SalaryCurrency;
(function (SalaryCurrency) {
    SalaryCurrency["INR"] = "INR";
    SalaryCurrency["USD"] = "USD";
    SalaryCurrency["EUR"] = "EUR";
    SalaryCurrency["GBP"] = "GBP";
})(SalaryCurrency || (exports.SalaryCurrency = SalaryCurrency = {}));
//# sourceMappingURL=types.js.map
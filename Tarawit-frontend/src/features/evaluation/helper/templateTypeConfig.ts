export const TEMPLATE_TYPE = {
  EVALUATION: "EVALUATION",
  SURVEY: "SURVEY",
} as const;

export type TemplateType = (typeof TEMPLATE_TYPE)[keyof typeof TEMPLATE_TYPE];

export const RESPONSE_ACTOR = {
  EVALUATOR: "EVALUATOR",
  TARGET: "TARGET",
} as const;

export type ResponseActor =
  (typeof RESPONSE_ACTOR)[keyof typeof RESPONSE_ACTOR];

export interface TemplateTypeConfig {
  canScore: boolean;
  label: string;
  responseActor: ResponseActor;

  showHeader: boolean;
  showAttachments: boolean;
  canUploadAttachments: boolean;
}

const DEFAULT_CONFIG: TemplateTypeConfig = {
  label: "ไม่ทราบประเภท",
  responseActor: RESPONSE_ACTOR.TARGET,
  showHeader: true,
  showAttachments: false,
  canUploadAttachments: false,
  canScore: false,
};

const TEMPLATE_TYPE_CONFIG: Record<TemplateType, TemplateTypeConfig> = {
  EVALUATION: {
    label: "แบบประเมิน",
    responseActor: RESPONSE_ACTOR.EVALUATOR,
    showHeader: true,
    showAttachments: true,
    canUploadAttachments: true,
    canScore: true,
  },

  SURVEY: {
    label: "แบบสอบถาม",
    responseActor: RESPONSE_ACTOR.TARGET,
    showHeader: true,
    showAttachments: false,
    canUploadAttachments: false,
    canScore: true,
  },
};

export function isTemplateType(value: unknown): value is TemplateType {
  return value === TEMPLATE_TYPE.EVALUATION || value === TEMPLATE_TYPE.SURVEY;
}

export function getTemplateTypeConfig(value: unknown): TemplateTypeConfig {
  if (!isTemplateType(value)) {
    return DEFAULT_CONFIG;
  }

  return TEMPLATE_TYPE_CONFIG[value];
}

export function canEvaluatorAnswer(value: unknown): boolean {
  return (
    getTemplateTypeConfig(value).responseActor === RESPONSE_ACTOR.EVALUATOR
  );
}

export function canTargetAnswer(value: unknown): boolean {
  return getTemplateTypeConfig(value).responseActor === RESPONSE_ACTOR.TARGET;
}

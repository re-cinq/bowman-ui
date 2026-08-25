// Red fixture: a props member named `t` must fail the banned-prop-name rule.
export interface TransgressorProps {
  t?: (key: string) => string;
}

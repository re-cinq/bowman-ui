// Red fixture: importing next-intl must trip no-restricted-imports.
// @ts-expect-error -- next-intl is deliberately not installed in this package.
import { useTranslations } from "next-intl";

export const Translated = () => {
  const t = useTranslations("chat");
  return <span aria-hidden="true">{t("copied")}</span>;
};

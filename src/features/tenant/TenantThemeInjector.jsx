import { getServerTenantConfig, themeToCssVars } from "@/lib/tenant/server";

export default async function TenantThemeInjector() {
  const config = await getServerTenantConfig();
  const theme = config.theme || {};
  const vars = themeToCssVars(theme);
  const customCss = theme.customCss || "";

  const css = `:root { ${Object.entries(vars)
    .map(([k, v]) => `${k}: ${v}`)
    .join("; ")} } ${customCss}`;

  return (
    <>
      {config.branding?.faviconUrl && <link rel="icon" href={config.branding.faviconUrl} />}
      <style id="tenant-theme" dangerouslySetInnerHTML={{ __html: css }} />
    </>
  );
}

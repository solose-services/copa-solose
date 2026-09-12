export function shouldProtectPath(pathname: string): boolean {
  if (!pathname.startsWith("/admin")) return false;
  return pathname !== "/admin/login";
}

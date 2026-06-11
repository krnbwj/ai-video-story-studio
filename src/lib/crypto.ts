export function simpleEncrypt(value: string): string {
  const secret = process.env.AUTH_SECRET ?? "dev-secret-change-me";
  return Buffer.from(`${secret}:${value}`).toString("base64");
}

export function simpleDecrypt(value: string): string {
  const secret = process.env.AUTH_SECRET ?? "dev-secret-change-me";
  const decoded = Buffer.from(value, "base64").toString("utf8");
  const prefix = `${secret}:`;
  if (!decoded.startsWith(prefix)) throw new Error("Invalid encrypted value");
  return decoded.slice(prefix.length);
}

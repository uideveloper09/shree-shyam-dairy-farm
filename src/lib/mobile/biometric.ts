"use client";

export function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  const key = "ssd_device_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export async function registerBiometric(): Promise<boolean> {
  if (!window.PublicKeyCredential) return false;

  const deviceId = getDeviceId();
  const optionsRes = await fetch("/api/v1/mobile/biometric/register-options", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceId }),
  });
  if (!optionsRes.ok) return false;

  const options = await optionsRes.json();
  options.challenge = base64ToBuffer(options.challenge);
  options.user.id = base64ToBuffer(options.user.id);
  if (options.excludeCredentials) {
    options.excludeCredentials = options.excludeCredentials.map((c: { id: string }) => ({
      ...c,
      id: base64ToBuffer(c.id),
    }));
  }

  const credential = (await navigator.credentials.create({
    publicKey: options,
  })) as PublicKeyCredential | null;

  if (!credential) return false;

  const attestation = credential.response as AuthenticatorAttestationResponse;
  const verifyRes = await fetch("/api/v1/mobile/biometric/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      deviceId,
      credentialId: bufferToBase64(credential.rawId),
      publicKey: bufferToBase64(attestation.getPublicKey()!),
      deviceLabel: navigator.userAgent.slice(0, 80),
    }),
  });

  return verifyRes.ok;
}

export async function loginWithBiometric(): Promise<boolean> {
  if (!window.PublicKeyCredential) return false;

  const deviceId = getDeviceId();
  const optionsRes = await fetch("/api/v1/mobile/biometric/login-options", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceId }),
  });
  if (!optionsRes.ok) return false;

  const options = await optionsRes.json();
  options.challenge = base64ToBuffer(options.challenge);
  if (options.allowCredentials) {
    options.allowCredentials = options.allowCredentials.map((c: { id: string }) => ({
      ...c,
      id: base64ToBuffer(c.id),
    }));
  }

  const assertion = (await navigator.credentials.get({
    publicKey: options,
  })) as PublicKeyCredential | null;

  if (!assertion) return false;

  const response = assertion.response as AuthenticatorAssertionResponse;
  const verifyRes = await fetch("/api/v1/mobile/biometric/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      credentialId: bufferToBase64(assertion.rawId),
      authenticatorData: bufferToBase64(response.authenticatorData),
      clientDataJSON: bufferToBase64(response.clientDataJSON),
      signature: bufferToBase64(response.signature),
    }),
  });

  return verifyRes.ok;
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const bin = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

function bufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function isBiometricAvailable(): boolean {
  return typeof window !== "undefined" && !!window.PublicKeyCredential;
}

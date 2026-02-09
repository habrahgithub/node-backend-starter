export function base64Encode(buffer) {
  return Buffer.from(buffer).toString("base64");
}

export function base64DecodeToBuffer(base64) {
  return Buffer.from(base64, "base64");
}


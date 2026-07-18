// Preferensi mikrofon per-perangkat (dipilih di halaman Pengaturan).
//
// Catatan penting: Web Speech API (subtitle live) TIDAK bisa memilih perangkat
// input — dia selalu mengikuti mikrofon default sistem. Preferensi ini hanya
// berlaku untuk fitur berbasis getUserMedia (monitor kualitas audio).
const MIC_DEVICE_KEY = "sibi-ai:mic-device-id";

export function getPreferredMicId(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(MIC_DEVICE_KEY) ?? "";
}

export function setPreferredMicId(deviceId: string) {
  localStorage.setItem(MIC_DEVICE_KEY, deviceId);
}

// Constraint getUserMedia yang menghormati pilihan mic; "ideal" (bukan "exact")
// supaya tetap jatuh ke default kalau perangkatnya sudah dicabut.
export function preferredAudioConstraint(): MediaStreamConstraints {
  const deviceId = getPreferredMicId();
  return { audio: deviceId ? { deviceId: { ideal: deviceId } } : true };
}

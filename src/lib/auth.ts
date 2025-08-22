import { apiFetch } from "./api";
import { startProgress, stopProgress } from "./progress";

export async function login(username: string, password: string) {
  try {
    startProgress();
    return await apiFetch("/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  } finally {
    stopProgress();
  }
}

export async function logout() {
  try {
    startProgress();
    return await apiFetch("/logout", { method: "POST" });
  } finally {
    stopProgress();
  }
}

export async function me() {
  try {
    startProgress();
    return await apiFetch("/me");
  } finally {
    stopProgress();
  }
}

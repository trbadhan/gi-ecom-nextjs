import NProgress from "nprogress";

export function startProgress() {
  NProgress.start();
}

export function stopProgress() {
  NProgress.done();
}

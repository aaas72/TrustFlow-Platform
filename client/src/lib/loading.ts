type Subscriber = (count: number) => void;

let count = 0;
const subs = new Set<Subscriber>();

type LoadingMeta = {
  message?: string;
  fullScreen?: boolean;
};

let meta: LoadingMeta = {};

export function startLoading() {
  count += 1;
  for (const s of subs) s(count);
}

export function doneLoading() {
  count = Math.max(0, count - 1);
  for (const s of subs) s(count);
}

export function getLoadingCount() {
  return count;
}

export function subscribeLoading(cb: Subscriber): () => void {
  subs.add(cb);
  cb(count);
  return () => {
    // Ensure cleanup returns void, not boolean
    subs.delete(cb);
  };
}

export function setLoadingMeta(next: LoadingMeta) {
  meta = { ...next };
}

export function clearLoadingMeta() {
  meta = {};
}

export function getLoadingMeta(): LoadingMeta {
  return meta;
}
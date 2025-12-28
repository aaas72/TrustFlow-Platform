import { useEffect, useState } from 'react';
import { subscribeLoading, getLoadingMeta } from '../../lib/loading';
import Loader from './Loader';

export default function GlobalLoader() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeLoading((count) => {
      setActive(count > 0);
    });
    return () => unsubscribe();
  }, []);

  if (!active) return null;

  const meta = getLoadingMeta();

  if (meta && meta.fullScreen) {
    return <Loader text={meta.message || "Yükleniyor..."} fullScreen overlay />;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none flex justify-center p-2">
      <Loader text="Yükleniyor..." size="sm" overlay={false} fullScreen={false} />
    </div>
  );
}
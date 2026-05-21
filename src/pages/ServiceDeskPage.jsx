import { useEffect } from 'react';
import { ServiceDesk } from '../features/service/ServiceDesk';

export function ServiceDeskPage() {
  // STRICT BACK BUTTON PREVENTION
  // Replace history so browser back button cannot exit dashboard
  useEffect(() => {
    // Replace current history entry - this removes the "back" destination
    window.history.replaceState({ page: 'service-desk' }, '', window.location.href);

    const handlePopState = (event) => {
      // If user somehow triggers popstate, push back to service desk
      window.history.pushState({ page: 'service-desk' }, '', window.location.href);
    };

    window.addEventListener('popstate', handlePopState, false);

    return () => {
      window.removeEventListener('popstate', handlePopState, false);
    };
  }, []);

  return <ServiceDesk />;
}

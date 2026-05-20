import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

// Define TurnstileWidgetProps locally since it's a component-specific type
interface TurnstileWidgetProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onError?: (error: any) => void;
  onExpire?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
  className?: string;
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: any) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
      getResponse: (widgetId: string) => string | undefined;
    };
  }
}

export const TurnstileWidget = ({
  siteKey,
  onVerify,
  onError,
  onExpire,
  theme = 'light',
  size = 'normal',
  className = '',
}: TurnstileWidgetProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const isRenderedRef = useRef(false);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    
    const loadScript = async () => {
      // Check if script is already loaded
      if (window.turnstile || scriptLoadedRef.current) {
        if (mounted) renderTurnstile();
        return;
      }

      // Check if script tag already exists
      const existingScript = document.querySelector('script[src*="turnstile"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => {
          if (mounted) renderTurnstile();
        });
        return;
      }

      // Load script
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        scriptLoadedRef.current = true;
        if (mounted) renderTurnstile();
      };
      
      script.onerror = () => {
        console.error('Failed to load Turnstile script');
        if (mounted && onError) {
          onError(new Error('Failed to load Turnstile script'));
        }
      };
      
      document.head.appendChild(script);
    };

    const renderTurnstile = () => {
      if (!containerRef.current || !window.turnstile || isRenderedRef.current) return;
      
      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => {
            if (mounted) onVerify(token);
          },
          'error-callback': onError,
          'expired-callback': onExpire,
          theme,
          size,
        });
        
        isRenderedRef.current = true;
      } catch (error) {
        console.error('Error rendering Turnstile widget:', error);
        if (onError) onError(error);
      }
    };

    loadScript();

    return () => {
      mounted = false;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (error) {
          console.error('Error removing Turnstile widget:', error);
        }
        widgetIdRef.current = null;
        isRenderedRef.current = false;
      }
    };
  }, [siteKey]); // Only re-render when siteKey changes

  return (
    <div className={cn("turnstile-container", className)}>
      <div ref={containerRef} style={{ minHeight: '65px' }}></div>
    </div>
  );
};
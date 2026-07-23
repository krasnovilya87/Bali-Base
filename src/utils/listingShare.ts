export const LISTING_SHARE_PARAM = 'listing';

export const buildListingShareUrl = (listingId: string) => {
  if (typeof window === 'undefined') return '';

  const url = new URL(window.location.href);
  url.searchParams.set(LISTING_SHARE_PARAM, listingId);
  url.hash = '';
  return url.toString();
};

const copyToClipboard = async (value: string) => {
  if (window.isSecureContext && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.setAttribute('aria-hidden', 'true');
  textarea.style.position = 'fixed';
  textarea.style.left = '0';
  textarea.style.top = '0';
  textarea.style.width = '1px';
  textarea.style.height = '1px';
  textarea.style.opacity = '0';
  textarea.style.pointerEvents = 'none';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);
  const didCopy = document.execCommand('copy');
  document.body.removeChild(textarea);
  if (!didCopy) {
    throw new Error('Copy command failed');
  }
};

const isMobileLikeDevice = () => {
  if (typeof navigator === 'undefined') return false;

  const userAgent = navigator.userAgent || '';
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
};

let toastTimer: number | null = null;

const showShareToast = (message: string) => {
  if (typeof document === 'undefined') return;

  const toastId = 'bali-base-share-toast';
  let toast = document.getElementById(toastId);

  if (!toast) {
    toast = document.createElement('div');
    toast.id = toastId;
    toast.setAttribute('role', 'status');
    toast.style.position = 'fixed';
    toast.style.left = '50%';
    toast.style.bottom = 'calc(24px + env(safe-area-inset-bottom, 0px))';
    toast.style.zIndex = '9999';
    toast.style.transform = 'translateX(-50%) translateY(12px)';
    toast.style.borderRadius = '999px';
    toast.style.background = 'rgba(30, 41, 59, 0.94)';
    toast.style.color = '#fff';
    toast.style.padding = '10px 16px';
    toast.style.fontSize = '13px';
    toast.style.fontWeight = '700';
    toast.style.boxShadow = '0 18px 45px rgba(15, 23, 42, 0.24)';
    toast.style.opacity = '0';
    toast.style.pointerEvents = 'none';
    toast.style.transition = 'opacity 180ms ease, transform 180ms ease';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  window.requestAnimationFrame(() => {
    if (!toast) return;
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });

  if (toastTimer !== null) {
    window.clearTimeout(toastTimer);
  }

  toastTimer = window.setTimeout(() => {
    const activeToast = document.getElementById(toastId);
    if (!activeToast) return;
    activeToast.style.opacity = '0';
    activeToast.style.transform = 'translateX(-50%) translateY(12px)';
  }, 2000);
};

export const shareListingLink = async (
  listing: { id: string; title: string },
  options?: { copiedMessage?: string; copyFailedMessage?: string }
) => {
  const url = buildListingShareUrl(listing.id);
  if (!url || typeof navigator === 'undefined') return;

  if (!isMobileLikeDevice() && navigator.share) {
    try {
      await navigator.share({
        title: listing.title,
        text: listing.title,
        url
      });
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
    }
  }

  try {
    await copyToClipboard(url);
    showShareToast(options?.copiedMessage || 'Link copied');
  } catch {
    showShareToast(options?.copyFailedMessage || 'Copy error');
  }
};

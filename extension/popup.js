const APP_ROOT = 'https://rinyd8792-coder.github.io/jingsitai/#';

function truncate(value, max) {
  if (!value) return '';
  return value.length > max ? value.slice(0, max) : value;
}

(async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const title = tab?.title || '网页待办';
  const url = tab?.url || '';

  document.getElementById('pageTitle').textContent = title;
  document.getElementById('pageUrl').textContent = url;

  let extracted = { selection: '', text: '' };

  if (tab?.id && /^https?:/i.test(url)) {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const selection = window.getSelection?.()?.toString()?.trim() || '';
          const article = document.querySelector('article') || document.querySelector('main') || document.body;
          const text = article?.innerText?.replace(/\s+/g, ' ').trim() || '';
          return { selection, text };
        }
      });
      extracted = results?.[0]?.result || extracted;
    } catch {
      // 某些受保护页面不允许注入脚本，仍可捕获标题与 URL。
    }
  }

  if (extracted.selection) {
    document.getElementById('selectionHint').style.display = 'block';
  }

  const buildParams = (mode) => {
    const params = new URLSearchParams({ capture: '1', mode, title, url });
    if (extracted.selection) params.set('selection', truncate(extracted.selection, 1800));
    else if (extracted.text) params.set('excerpt', truncate(extracted.text, 4500));
    return params;
  };

  document.getElementById('quick').onclick = () => {
    chrome.tabs.create({ url: `${APP_ROOT}/capture?${buildParams('quick').toString()}` });
    window.close();
  };

  document.getElementById('organize').onclick = () => {
    chrome.tabs.create({ url: `${APP_ROOT}/capture?${buildParams('organize').toString()}` });
    window.close();
  };
})();

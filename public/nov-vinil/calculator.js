(() => {
  const get = (id) => document.getElementById('vinyl-' + id);
  const form = get('quote');
  const width = get('width');
  const height = get('height');
  const quantity = get('quantity');
  const banner = get('banner');
  const artwork = get('artwork');
  const total = get('total');
  const summary = get('summary');
  const inquiry = get('inquiry');
  const inquiryBox = get('inquiry-box');
  const message = get('message');
  const presets = [...form.querySelectorAll('[data-size]')];
  const number = new Intl.NumberFormat('bg-BG', { maximumFractionDigits: 4 });
  const money = new Intl.NumberFormat('bg-BG', { style: 'currency', currency: 'EUR' });
  let quote;
  let pending;
  let timer;
  let objectUrl;

  function update() {
    clearTimeout(timer);
    pending?.abort();
    quote = undefined;
    inquiry.disabled = true;
    inquiryBox.hidden = true;

    const w = width.valueAsNumber;
    const h = height.valueAsNumber;
    const count = quantity.valueAsNumber;
    const validSize = width.validity.valid && height.validity.valid;
    for (const button of presets) {
      button.setAttribute('aria-pressed', String(validSize && button.dataset.size === w + 'x' + h));
    }
    banner.hidden = !validSize;
    if (validSize) {
      banner.style.setProperty('--banner-width', 100 * Math.min(w / h / 1.6, 1) + '%');
      banner.style.setProperty('--banner-height', 100 * Math.min(h / w * 1.6, 1) + '%');
      get('size').textContent = number.format(w) + ' × ' + number.format(h) + ' см';
    } else {
      get('size').textContent = 'Въведи размери';
    }

    if (!validSize || !quantity.validity.valid) {
      total.textContent = 'Провери размерите и броя';
      summary.textContent = 'Размери 1–5000 см · количество 1–100 бр.';
      return;
    }

    const dimensions = {
      width_cm: w,
      height_cm: h,
      quantity: count,
      with_design: form.elements.design.value === 'with'
    };
    summary.textContent = 'Обща площ: ' + number.format(w * h * count / 10000) + ' м² · ' + count + ' бр.';
    total.textContent = 'Изчисляване…';
    timer = setTimeout(() => loadQuote(dimensions), 220);
  }

  async function loadQuote(dimensions) {
    const controller = new AbortController();
    pending = controller;
    try {
      const response = await fetch('/api/design/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dimensions),
        signal: controller.signal
      });
      if (!response.ok) throw new Error('Quote unavailable');
      const result = await response.json();
      if (controller.signal.aborted) return;
      if (!Number.isFinite(result.total_eur)) throw new Error('Price missing');
      quote = { ...dimensions, total_eur: result.total_eur };
      total.textContent = money.format(result.total_eur);
      inquiry.disabled = false;
    } catch {
      if (!controller.signal.aborted) total.textContent = 'Цената е временно недостъпна';
    } finally {
      if (pending === controller) pending = undefined;
    }
  }

  for (const field of [width, height, quantity, ...form.querySelectorAll('[name="design"]')]) {
    field.addEventListener('input', update);
  }

  for (const button of presets) {
    button.addEventListener('click', () => {
      [width.value, height.value] = button.dataset.size.split('x');
      update();
    });
  }

  get('swap').addEventListener('click', () => {
    [width.value, height.value] = [height.value, width.value];
    update();
  });

  for (const button of form.querySelectorAll('[data-quantity]')) {
    button.addEventListener('click', () => {
      const next = (quantity.valueAsNumber || 1) + Number(button.dataset.quantity);
      quantity.value = Math.min(100, Math.max(1, Math.round(next)));
      update();
    });
  }

  const fileInput = get('file');
  const fileStatus = get('file-status');
  const remove = get('remove');
  function clearArtwork() {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = undefined;
    artwork.hidden = true;
    artwork.removeAttribute('src');
    remove.hidden = true;
  }

  fileInput.addEventListener('change', () => {
    clearArtwork();
    const file = fileInput.files[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 15 * 1024 * 1024) {
      fileInput.value = '';
      fileStatus.textContent = 'Избери JPG, PNG или WebP до 15 MB.';
      return;
    }
    objectUrl = URL.createObjectURL(file);
    artwork.src = objectUrl;
    artwork.hidden = false;
    remove.hidden = false;
    fileStatus.textContent = file.name + ' · Изпрати файла отделно във Viber.';
  });

  artwork.addEventListener('error', () => {
    clearArtwork();
    fileInput.value = '';
    fileStatus.textContent = 'Изображението не може да се отвори.';
  });

  remove.addEventListener('click', () => {
    clearArtwork();
    fileInput.value = '';
    fileStatus.textContent = 'Изображението е премахнато от визуализацията.';
    fileInput.focus();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!quote) return;
    message.value = [
      'Здравейте! Искам оферта за печат на винил.',
      'Размер: ' + number.format(quote.width_cm) + ' × ' + number.format(quote.height_cm) + ' см',
      'Количество: ' + quote.quantity + ' бр.',
      'Дизайн: ' + (quote.with_design ? 'С дизайн' : 'Имам готов файл'),
      'Ориентировъчна цена: ' + money.format(quote.total_eur),
      'Моля, потвърдете цената и срока за изпълнение.'
    ].join('\n');
    inquiryBox.hidden = false;
    get('copy-status').textContent = '';
    message.focus();
    message.select();
  });

  get('copy').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(message.value);
      get('copy-status').textContent = 'Копирано. Постави текста в разговора във Viber.';
    } catch {
      message.focus();
      message.select();
      get('copy-status').textContent = 'Копирай маркирания текст и го постави във Viber.';
    }
  });

  update();
})();

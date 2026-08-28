function getDataFileUrl(fileName) {
  const script = document.querySelector('script[src*="assets/js/data.js"]');
  if (script?.src) {
    return new URL(`../../data/${fileName}`, new URL(script.src, document.baseURI)).href;
  }
  return new URL(`data/${fileName}`, document.baseURI).href;
}

async function loadSchoolData() {
  try {
    const response = await fetch(getDataFileUrl('sekolah.json'));
    if (!response.ok) throw new Error(`Gagal memuat data sekolah: HTTP ${response.status}`);
    const data = await response.json();

    try {
      const statsResponse = await fetch('https://offjdeutxvcrybniftyl.supabase.co/functions/v1/get-public-homepage-statistics', { cache: 'no-store' });
      if (statsResponse.ok) {
        const statsPayload = await statsResponse.json();
        const stats = statsPayload.statistics;
        if (stats) {
          data.tahunPelajaran = stats.school_year;
          data.jumlahRombel = stats.class_groups;
          data.jumlahGuruTendik = stats.teachers_staff;
          data.jumlahPesertaDidik = stats.students;
        }
      }
    } catch (statsError) {
      console.warn('Statistik Supabase gagal dimuat; menggunakan data cadangan.', statsError);
    }

    document.querySelectorAll('[data-school]').forEach((element) => {
      const key = element.dataset.school;
      const value = key.split('.').reduce((current, part) => current?.[part], data);
      if (value !== null && value !== undefined && value !== '') element.textContent = value;
    });

    document.querySelectorAll('[data-school-href], [data-school-link]').forEach((element) => {
      const key = element.dataset.schoolHref || element.dataset.schoolLink;
      const value = key.split('.').reduce((current, part) => current?.[part], data);
      if (value) {
        element.href = value;
        element.target = '_blank';
        element.rel = 'noopener noreferrer';
      }
    });

    document.querySelectorAll('[data-school-email]').forEach((element) => {
      if (data.email) {
        element.href = `mailto:${data.email}`;
      } else {
        element.hidden = true;
      }
    });

    const stats = document.querySelectorAll('.stats .stat');
    if (stats.length >= 4) {
      const values = [data.tahunPelajaran, data.jumlahRombel, data.jumlahGuruTendik, data.jumlahPesertaDidik];
      stats.forEach((stat, index) => {
        const value = values[index];
        const number = stat.querySelector('h3');
        if (number && value !== null && value !== undefined && value !== '') number.textContent = value;
      });
    }

    const quote = document.querySelector('.quote p');
    if (quote && data.quote) quote.textContent = data.quote;
    const quoteAuthor = document.querySelector('.quote span');
    if (quoteAuthor && data.nama) quoteAuthor.textContent = data.nama;

    const contactCards = document.querySelectorAll('.contact .card');
    if (contactCards.length >= 3) {
      const address = contactCards[0].querySelector('p');
      const maps = contactCards[0].querySelector('a');
      if (address && data.alamat) address.textContent = data.alamat;
      if (maps && data.googleMaps) {
        maps.href = data.googleMaps;
        maps.target = '_blank';
        maps.rel = 'noopener noreferrer';
      }

      const emailText = contactCards[1].querySelector('p');
      const emailLink = contactCards[1].querySelector('a');
      if (data.email) {
        if (emailText) emailText.textContent = data.email;
        if (emailLink) {
          const recipient = encodeURIComponent(data.email);
          emailLink.href = `https://mail.google.com/mail/?view=cm&fs=1&to=${recipient}`;
          emailLink.target = '_blank';
          emailLink.rel = 'noopener noreferrer';
        }
      } else {
        if (emailText) emailText.textContent = 'Email resmi sekolah belum tersedia.';
        if (emailLink) emailLink.hidden = true;
      }

      const serviceHours = contactCards[2].querySelector('p');
      if (serviceHours && data.jamLayanan) serviceHours.textContent = data.jamLayanan;
    }

    const footerAddress = document.querySelector('.footer-address');
    if (footerAddress && data.alamat) footerAddress.textContent = data.alamat;
  } catch (error) {
    console.error('Data sekolah gagal dimuat:', error);
  }
}

document.addEventListener('DOMContentLoaded', loadSchoolData);

document.addEventListener('DOMContentLoaded', () => {
  const year = document.querySelector('[data-current-year]');
  if (year) year.textContent = new Date().getFullYear();

  document.querySelectorAll('.popup-menu a[href$="pendidikan-inklusi.html"]').forEach((link) => {
    link.textContent = 'Pendidikan Inklusi';
  });

  const isRootPage = !window.location.pathname.includes('/halaman/');

  const popupMenu = document.querySelector('.popup-menu');
  if (popupMenu && !popupMenu.querySelector('a[data-spmb-menu-link]')) {
    const spmbLink = document.createElement('a');
    spmbLink.href = isRootPage ? 'halaman/spmb.html' : 'spmb.html';
    spmbLink.dataset.spmbMenuLink = 'true';
    spmbLink.innerHTML = '<span class="menu-link-label">SPMB</span><span class="menu-status-badge is-inactive" data-spmb-menu-status>Nonaktif</span>';
    if (window.location.pathname.endsWith('/spmb.html')) spmbLink.classList.add('active');
    const layananLink = Array.from(popupMenu.querySelectorAll('a')).find((link) => link.getAttribute('href')?.endsWith('layanan.html'));
    if (layananLink) layananLink.insertAdjacentElement('afterend', spmbLink);
    else popupMenu.appendChild(spmbLink);

    fetch('https://offjdeutxvcrybniftyl.supabase.co/functions/v1/get-public-spmb-status', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((status) => {
        const active = Boolean(status.is_active);
        const badge = spmbLink.querySelector('[data-spmb-menu-status]');
        if (badge) {
          badge.textContent = active ? 'Aktif' : 'Nonaktif';
          badge.classList.toggle('is-active', active);
          badge.classList.toggle('is-inactive', !active);
        }
        document.querySelectorAll('[data-spmb-page-status]').forEach((element) => {
          element.textContent = active ? 'SPMB Sedang Aktif' : 'SPMB Belum Aktif';
          element.classList.toggle('is-active', active);
          element.classList.toggle('is-inactive', !active);
        });
        document.querySelectorAll('[data-spmb-status-message]').forEach((element) => {
          element.textContent = active
            ? 'Informasi SPMB sedang aktif. Silakan ikuti pengumuman dan petunjuk resmi yang tersedia.'
            : 'Saat ini belum memasuki masa SPMB. Informasi jadwal dan ketentuan resmi akan ditampilkan ketika layanan diaktifkan.';
        });
      })
      .catch(() => {});
  }
  if (popupMenu && !popupMenu.querySelector('a[data-admin-panel-link]')) {
    const adminLink = document.createElement('a');
    adminLink.href = isRootPage ? 'halaman/admin.html' : 'admin.html';
    adminLink.textContent = 'Panel Admin';
    adminLink.dataset.adminPanelLink = 'true';
    adminLink.target = '_blank';
    adminLink.rel = 'noopener noreferrer';
    popupMenu.appendChild(adminLink);
  }

  const layananColumn = Array.from(document.querySelectorAll('.footer-column')).find((column) => {
    return column.querySelector('h3')?.textContent.trim().toLowerCase() === 'layanan';
  });
  if (layananColumn && !layananColumn.querySelector('a[href$="pendidikan-inklusi.html"]')) {
    const link = document.createElement('a');
    link.href = isRootPage ? 'halaman/pendidikan-inklusi.html' : 'pendidikan-inklusi.html';
    link.textContent = 'Pendidikan Inklusi';
    layananColumn.appendChild(link);
  }

  if (layananColumn) {
    const inklusiLink = layananColumn.querySelector('a[href$="pendidikan-inklusi.html"]');
    let spmbLink = layananColumn.querySelector('a[href$="spmb.html"]');
    if (!spmbLink) {
      spmbLink = document.createElement('a');
      spmbLink.href = isRootPage ? 'halaman/spmb.html' : 'spmb.html';
      spmbLink.textContent = 'SPMB';
    }
    if (inklusiLink) inklusiLink.insertAdjacentElement('afterend', spmbLink);
    else layananColumn.appendChild(spmbLink);
  }

  const navigasiColumn = Array.from(document.querySelectorAll('.footer-column')).find((column) => {
    return column.querySelector('h3')?.textContent.trim().toLowerCase() === 'navigasi';
  });
  if (navigasiColumn && !navigasiColumn.querySelector('a[data-admin-panel-link]')) {
    const adminLink = document.createElement('a');
    adminLink.href = isRootPage ? 'halaman/admin.html' : 'admin.html';
    adminLink.textContent = 'Panel Admin';
    adminLink.dataset.adminPanelLink = 'true';
    adminLink.target = '_blank';
    adminLink.rel = 'noopener noreferrer';
    navigasiColumn.appendChild(adminLink);
  }

  if (document.body.classList.contains('page-pendidikan-inklusi')) {
    const heroTitle = document.querySelector('.hero h1');
    if (heroTitle) heroTitle.innerHTML = 'Layanan <span>Pendidikan Inklusi</span>';
  }
});

(() => {
  if (document.querySelector('script[data-icon-custom]')) return;
  const dataScript = document.querySelector('script[src*="assets/js/data.js"]');
  const src = dataScript?.src
    ? new URL('icon-custom.js', dataScript.src).href
    : new URL('assets/js/icon-custom.js', document.baseURI).href;
  const script = document.createElement('script');
  script.src = src;
  script.defer = true;
  script.dataset.iconCustom = 'true';
  document.head.appendChild(script);
})();

(() => {
  const dataScript = document.querySelector('script[src*="assets/js/data.js"]');
  const siteBase = dataScript?.src
    ? new URL('../../', dataScript.src).href
    : new URL('./', document.baseURI).href;
  const path = window.location.pathname;
  const file = path.split('/').pop() || 'index.html';
  const isAdmin = file.startsWith('admin');

  const seo = {
    'index.html': {
      title: 'SDN Kalibaru 3 Depok | Website Sekolah Resmi',
      description: 'Website resmi SDN Kalibaru 3 Depok, Kecamatan Cilodong, Kota Depok. Informasi profil sekolah, pengumuman, agenda, prestasi, ekstrakurikuler, pendidikan inklusi, dan layanan digital.',
      canonical: siteBase
    },
    'profil.html': {
      title: 'Profil SDN Kalibaru 3 Depok | Tentang Sekolah',
      description: 'Profil SDN Kalibaru 3 Depok meliputi identitas sekolah, visi, misi, fasilitas, dan informasi satuan pendidikan.',
      canonical: new URL('halaman/profil.html', siteBase).href
    },
    'informasi.html': {
      title: 'Informasi Sekolah | SDN Kalibaru 3 Depok',
      description: 'Informasi terbaru SDN Kalibaru 3 Depok: pengumuman, agenda kegiatan, dokumen sekolah, seragam, dan galeri kegiatan.',
      canonical: new URL('halaman/informasi.html', siteBase).href
    },
    'ekstrakurikuler.html': {
      title: 'Ekstrakurikuler | SDN Kalibaru 3 Depok',
      description: 'Informasi kegiatan ekstrakurikuler SDN Kalibaru 3 Depok untuk pengembangan minat, bakat, karakter, dan prestasi peserta didik.',
      canonical: new URL('halaman/ekstrakurikuler.html', siteBase).href
    },
    'prestasi.html': {
      title: 'Prestasi | SDN Kalibaru 3 Depok',
      description: 'Daftar prestasi peserta didik dan sekolah SDN Kalibaru 3 Depok dalam bidang akademik maupun nonakademik.',
      canonical: new URL('halaman/prestasi.html', siteBase).href
    },
    'pendidikan-inklusi.html': {
      title: 'Pendidikan Inklusi | SDN Kalibaru 3 Depok',
      description: 'Informasi layanan pendidikan inklusi SDN Kalibaru 3 Depok sebagai sekolah rujukan inklusi di wilayah Kecamatan Cilodong.',
      canonical: new URL('halaman/pendidikan-inklusi.html', siteBase).href
    },
    'layanan.html': {
      title: 'Layanan Digital | SDN Kalibaru 3 Depok',
      description: 'Akses layanan digital SDN Kalibaru 3 Depok, termasuk Jurnal 7 KAIH, rekap jurnal, pembelajaran, dan layanan sekolah lainnya.',
      canonical: new URL('halaman/layanan.html', siteBase).href
    },
    'pembelajaran.html': {
      title: 'Pembelajaran | SDN Kalibaru 3 Depok',
      description: 'Materi dan sumber pembelajaran digital untuk peserta didik SDN Kalibaru 3 Depok.',
      canonical: new URL('halaman/pembelajaran.html', siteBase).href
    },
    'spmb.html': {
      title: 'SPMB | SDN Kalibaru 3 Depok',
      description: 'Informasi Sistem Penerimaan Murid Baru SDN Kalibaru 3 Depok, meliputi status layanan, alur, persiapan, dan informasi resmi.',
      canonical: new URL('halaman/spmb.html', siteBase).href
    },
    'pengumuman.html': {
      title: 'Pengumuman Sekolah | SDN Kalibaru 3 Depok',
      description: 'Pengumuman dan informasi resmi terbaru dari SDN Kalibaru 3 Depok.',
      canonical: new URL('halaman/pengumuman.html', siteBase).href
    },
    'agenda.html': {
      title: 'Agenda Sekolah | SDN Kalibaru 3 Depok',
      description: 'Agenda dan jadwal kegiatan terbaru SDN Kalibaru 3 Depok.',
      canonical: new URL('halaman/agenda.html', siteBase).href
    },
    'semua-pengumuman.html': {
      title: 'Semua Pengumuman | SDN Kalibaru 3 Depok',
      description: 'Arsip pengumuman resmi SDN Kalibaru 3 Depok.',
      canonical: new URL('halaman/semua-pengumuman.html', siteBase).href
    },
    'semua-agenda.html': {
      title: 'Semua Agenda | SDN Kalibaru 3 Depok',
      description: 'Arsip agenda dan kegiatan SDN Kalibaru 3 Depok.',
      canonical: new URL('halaman/semua-agenda.html', siteBase).href
    },
    'semua-dokumen.html': {
      title: 'Dokumen Sekolah | SDN Kalibaru 3 Depok',
      description: 'Dokumen dan unduhan publik SDN Kalibaru 3 Depok.',
      canonical: new URL('halaman/semua-dokumen.html', siteBase).href
    },
    'semua-galeri.html': {
      title: 'Galeri Kegiatan | SDN Kalibaru 3 Depok',
      description: 'Galeri foto kegiatan dan dokumentasi SDN Kalibaru 3 Depok.',
      canonical: new URL('halaman/semua-galeri.html', siteBase).href
    },
    'hubungi-kami.html': {
      title: 'Hubungi Kami | SDN Kalibaru 3 Depok',
      description: 'Kontak dan ruang komunikasi resmi SDN Kalibaru 3 Depok.',
      canonical: new URL('halaman/hubungi-kami.html', siteBase).href
    }
  };

  const current = seo[file] || (path.endsWith('/') ? seo['index.html'] : null);

  const setMeta = (selector, attrs) => {
    let el = document.head.querySelector(selector);
    if (!el) {
      el = document.createElement('meta');
      document.head.appendChild(el);
    }
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
  };

  const setLink = (rel, href) => {
    let el = document.head.querySelector(`link[rel="${rel}"]`);
    if (!el) {
      el = document.createElement('link');
      el.rel = rel;
      document.head.appendChild(el);
    }
    el.href = href;
  };

  if (isAdmin) {
    setMeta('meta[name="robots"]', { name: 'robots', content: 'noindex, nofollow, noarchive' });
    return;
  }

  if (!current) return;

  document.title = current.title;
  setMeta('meta[name="description"]', { name: 'description', content: current.description });
  setMeta('meta[name="robots"]', { name: 'robots', content: 'index, follow, max-image-preview:large' });
  setLink('canonical', current.canonical);

  setMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' });
  setMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: 'SDN Kalibaru 3 Depok' });
  setMeta('meta[property="og:title"]', { property: 'og:title', content: current.title });
  setMeta('meta[property="og:description"]', { property: 'og:description', content: current.description });
  setMeta('meta[property="og:url"]', { property: 'og:url', content: current.canonical });
  setMeta('meta[property="og:image"]', { property: 'og:image', content: new URL('assets/images/sekolah1.jpeg', siteBase).href });
  setMeta('meta[property="og:locale"]', { property: 'og:locale', content: 'id_ID' });

  setMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
  setMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: current.title });
  setMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: current.description });
  setMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: new URL('assets/images/sekolah1.jpeg', siteBase).href });

  if (file === 'index.html' || path.endsWith('/')) {
    let jsonLd = document.head.querySelector('script[data-school-schema]');
    if (!jsonLd) {
      jsonLd = document.createElement('script');
      jsonLd.type = 'application/ld+json';
      jsonLd.dataset.schoolSchema = 'true';
      document.head.appendChild(jsonLd);
    }
    jsonLd.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'School',
      name: 'SDN Kalibaru 3 Depok',
      alternateName: 'SDN Kalibaru 3',
      url: siteBase,
      logo: new URL('assets/images/logo-kb3.svg', siteBase).href,
      image: new URL('assets/images/sekolah1.jpeg', siteBase).href,
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Kota Depok',
        addressRegion: 'Jawa Barat',
        addressCountry: 'ID'
      }
    });
  }
})();
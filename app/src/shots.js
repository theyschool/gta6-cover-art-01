// Vice Cover — the four screenshot scenes. Each scene is one screenshot the
// maker takes: the file name, what it shows, and the cover state it is shot
// with. The first by name is the cover. The shot driver reads these and opens
// the app with ?shot= and ?state= for each one.

export const SCENES = [
  {
    file: '1-cover.jpg',
    kind: 'cover',
    w: 1024,
    h: 1024,
    caption: 'Neon Coast',
    tagline: 'VICE CITY',
    layout: 'corners',
    grade: 'ocean',
    style: 'block',
    panels: [
      { photo: 0, zoom: 1.15, x: 0, y: 0.1 },
      { photo: 1, zoom: 1.1, x: 0, y: -0.1 },
      { photo: 1, zoom: 1.25, x: 0.1, y: 0 },
      { photo: 0, zoom: 1.05, x: -0.1, y: 0.1 },
    ],
    note: 'The cover: a Four Corners mosaic in Ocean Drive with the block caption.',
  },
  {
    file: '2-editor.jpg',
    kind: 'editor',
    w: 1280,
    h: 1000,
    caption: 'Sunset Heist',
    tagline: 'VICE CITY',
    layout: 'grid',
    grade: 'sunset',
    style: 'neon',
    panels: [
      { photo: 0, zoom: 1, x: 0, y: 0 },
      { photo: 0, zoom: 1.2, x: 0.15, y: 0 },
      { photo: 1, zoom: 1, x: 0, y: 0.1 },
      { photo: 1, zoom: 1, x: 0, y: 0 },
    ],
    note: 'The editor with a photo loaded: preview, panels and controls.',
  },
  {
    file: '3-cover.jpg',
    kind: 'cover',
    w: 1024,
    h: 1280,
    caption: 'Night Shift',
    tagline: 'LEONIDA',
    layout: 'hero',
    grade: 'neon',
    style: 'outline',
    panels: [
      { photo: 1, zoom: 1.2, x: 0, y: -0.05 },
      { photo: 0, zoom: 1.1, x: 0, y: 0 },
      { photo: 0, zoom: 1.3, x: -0.1, y: 0.1 },
      { photo: 1, zoom: 1, x: 0, y: 0 },
    ],
    note: 'A tall cover: Hero + Strip in Neon Night with the outline caption.',
  },
  {
    file: '4-cover.jpg',
    kind: 'cover',
    w: 1280,
    h: 720,
    caption: 'Golden Hour',
    tagline: 'OCEAN DRIVE',
    layout: 'strip',
    grade: 'gold',
    style: 'neon',
    panels: [
      { photo: 0, zoom: 1.1, x: 0, y: 0.05 },
      { photo: 1, zoom: 1.15, x: 0, y: -0.05 },
      { photo: 0, zoom: 1.25, x: 0.1, y: 0 },
      { photo: 1, zoom: 1, x: 0, y: 0 },
    ],
    note: 'A wide cover: Sunset Strip in Palm Gold, the 1920 x 1080 post size.',
  },
];

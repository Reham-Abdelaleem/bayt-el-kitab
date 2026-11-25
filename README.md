# Bayt El Kitab – Online Catalogue & Order MVP

A lightweight, three-page front-end portal for **Bayt El Kitab**, an independent bookshop in Alexandria, Egypt. Customers can browse the inventory, search for titles or authors, and submit a book order request from a phone or laptop.

The site is **frontend-only**: vanilla HTML5, CSS3 and JavaScript (ES6+). There are no frameworks, build tools, fetch calls or server-side database.

## Pages

| File | Purpose |
| --- | --- |
| `index.html` | Home page: welcome message, "Our Story" and a call to action |
| `catalogue.html` | Browse and search the 40 books, add titles to the order |
| `order.html` | Order request form with validation and a thank-you message |

## Project structure

```
bayt-el-kitab-mvp/
├── assets/
│   ├── books.json        # original client inventory (reference copy)
│   ├── brand_notes.md    # brand guidelines
│   └── page_content.md   # official website copy
├── css/
│   └── style.css         # brand styling, mobile-first Flexbox layout
├── js/
│   ├── app.js            # CartItem class, search, rendering, validation
│   └── data.js           # books.json converted to a JavaScript array
├── index.html
├── catalogue.html
├── order.html
└── README.md
```

## How to run

No installation is needed.

1. Download or clone the repository.
2. Open `index.html` in any modern browser (Chrome, Edge, Firefox, Safari).
3. Navigate using the header links.

Note for Firefox: when a file is opened directly, Firefox keeps each page's browser storage separate. The order is therefore also carried in the page links (`?cart=...`), so it stays visible on the order page. Running a local server (see below) avoids this entirely.

To check the mobile layout, open the browser developer tools (F12 or Ctrl+Shift+M / Cmd+Shift+M) and choose a phone size such as 390 × 844.

Optional: serve the folder with any static server (for example `python -m http.server`) and visit `http://localhost:8000`.

## Key features

- **Catalogue rendering:** `renderCatalogue()` loops over the `BOOKS` array and creates one card per book with `document.createElement`. Cards form a grid: one column on phones, two on tablets, three on desktops.
- **Search:** `filterBooks()` matches the query against both title and author, ignoring case and surrounding spaces. Results update as the visitor types and on submit. An empty-state message appears when nothing matches.
- **Stock status:** Books marked out of stock show "Currently unavailable" and their "Add to Order" button is disabled.
- **Order cart:** Each click on "Add to Order" creates a new `CartItem` object (title, quantity, price in EGP). Adding the same book again increases its quantity. The order is saved in `localStorage` so it carries over to the order page.
- **Form validation:** All four fields are required. Name needs at least 2 characters, address at least 5, email must be a valid address, and phone must be an Egyptian mobile number (010, 011, 012 or 015 followed by 8 digits). Each field is checked when the visitor leaves it, and its message clears as soon as it is fixed.
- **Responsive design:** Flexbox and CSS grid adapt the layout to the screen. Nothing scrolls sideways at 360 px or wider.
- **Motion:** Cards and sections fade in on load. Cards lift on hover (mouse devices only). All motion is switched off when the device requests reduced motion.

## Brand

- Colours: Mediterranean Navy `#1A365D`, Parchment White `#F9F6F0`, Terracotta Red `#C05640`, Olive Wood `#8A785E`.
- Fonts: Lora (headings), Cairo (body) and Amiri (Arabic accent), loaded from Google Fonts with Georgia / Arial fallbacks.
- Corners: 6 px radius on buttons, inputs and cards.

## Notes and limitations

- Book covers are generated placeholders (the first letter of the title). Real cover images can be added later.
- Order requests are not sent to a server. The thank-you message appears on the page, and the order is cleared from the browser after submission. Staff confirmation and payment on delivery or pickup happen outside the site.
- Payment is not handled online, consistent with the Beta launch brief.

## Screenshots

Captured in headless Google Chrome (1280 px desktop, 390 px mobile) with animations switched off. They are stored in `docs/screenshots/`.

| Page | Desktop | Mobile |
| --- | --- | --- |
| Home | ![Home on desktop](docs/screenshots/index_desktop.png) | ![Home on mobile](docs/screenshots/index_mobile.png) |
| Catalogue | ![Catalogue on desktop](docs/screenshots/catalogue_desktop.png) | ![Catalogue on mobile](docs/screenshots/catalogue_mobile.png) |
| Order Form | ![Order form on desktop](docs/screenshots/order_desktop.png) | ![Order form on mobile](docs/screenshots/order_mobile.png) |

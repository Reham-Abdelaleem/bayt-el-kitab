/*
 * app.js
 * ---------------------------------------------------------------
 * Behaviour for the Bayt El Kitab MVP. The file works on two pages:
 *   - catalogue.html : renders the BOOKS array, runs search, adds to order
 *   - order.html     : shows the order summary and validates the form
 *
 * BOOKS is defined in js/data.js, which must be loaded first.
 * Everything runs in the browser; there are no server calls.
 * ---------------------------------------------------------------
 */

/* ===============================================================
   1. CartItem class (OOP)
   One CartItem is created each time a visitor clicks "Add to Order".
   =============================================================== */

class CartItem {
  /**
   * @param {string} title     - book title
   * @param {number} quantity  - how many copies (defaults to 1)
   * @param {number} price     - unit price in EGP
   */
  constructor(title, quantity = 1, price = 0) {
    this.title = title;
    this.quantity = quantity;
    this.price = price;
  }

  /** Total cost for this line (unit price x quantity), in EGP. */
  get lineTotal() {
    return this.price * this.quantity;
  }

  /** Increase the number of copies by one. */
  addOne() {
    this.quantity += 1;
  }
}

/* ===============================================================
   2. Order storage
   The order is kept in localStorage so it survives the move from
   the catalogue page to the order page. Only plain data is stored;
   CartItem objects are rebuilt from it when needed.
   =============================================================== */

const ORDER_STORAGE_KEY = "bayt-el-kitab-order";

/** Read the saved order and turn each entry back into a CartItem. */
function loadOrder() {
  try {
    const saved = JSON.parse(localStorage.getItem(ORDER_STORAGE_KEY)) || [];
    return saved.map((item) => new CartItem(item.title, item.quantity, item.price));
  } catch (error) {
    // Corrupt or unavailable storage: start with an empty order.
    return [];
  }
}

/** Save the current order array. */
function saveOrder(order) {
  try {
    localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(order));
  } catch (error) {
    // Storage may be blocked (e.g. private browsing). The page still works.
  }
}

/* ===============================================================
   3. Search and filtering
   =============================================================== */

/**
 * Return the books whose title OR author contains the search query.
 *
 * - toLowerCase() makes the match case-insensitive ("naguib" finds "Naguib").
 * - trim() removes spaces typed at the start or end of the query.
 * - includes() checks whether the query appears anywhere in the text,
 *   so a partial word such as "cairo" still matches "The Cairo Trilogy".
 * - An empty query returns every book.
 *
 * @param {Array<Object>} books - the inventory array (BOOKS)
 * @param {string} query        - raw text typed by the visitor
 * @returns {Array<Object>}     - books that match
 */
function filterBooks(books, query) {
  const needle = query.trim().toLowerCase();

  if (needle === "") {
    return books;
  }

  return books.filter((book) => {
    const titleMatch = book.title.toLowerCase().includes(needle);
    const authorMatch = book.author.toLowerCase().includes(needle);
    return titleMatch || authorMatch;
  });
}

/* ===============================================================
   4. Catalogue rendering
   =============================================================== */

/**
 * Build one table row for a book. Each cell is created with
 * createElement and filled with textContent, which is safe against
 * HTML injection because the text is never parsed as markup.
 *
 * @param {Object} book - one entry from BOOKS
 * @returns {HTMLTableRowElement}
 */
function createBookRow(book, index = 0) {
  const row = document.createElement("tr");
  // Index drives the staggered entrance animation in style.css.
  row.style.setProperty("--i", index);

  // Cover: a navy tile showing the first letter of the title.
  const coverCell = document.createElement("td");
  coverCell.className = "cover-cell";
  const cover = document.createElement("div");
  cover.className = "cover";
  cover.setAttribute("aria-hidden", "true");
  cover.textContent = book.title.charAt(0);
  coverCell.appendChild(cover);

  const titleCell = document.createElement("td");
  titleCell.className = "cell-title";
  titleCell.textContent = book.title;

  const authorCell = document.createElement("td");
  authorCell.className = "cell-author";
  authorCell.textContent = book.author;

  const categoryCell = document.createElement("td");
  categoryCell.className = "cell-category";
  categoryCell.textContent = book.category;

  const priceCell = document.createElement("td");
  priceCell.className = "cell-price";
  priceCell.textContent = book.price_egp;

  // Action: stock status and the "Add to Order" button.
  const actionCell = document.createElement("td");
  actionCell.className = "cell-action";

  const stock = document.createElement("span");
  stock.className = "cell-stock " + (book.in_stock ? "in-stock" : "out-of-stock");
  stock.textContent = book.in_stock ? "In stock" : "Currently unavailable";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "btn";
  button.textContent = "Add to Order";
  button.disabled = !book.in_stock;   // unavailable titles cannot be ordered
  button.addEventListener("click", () => addToOrder(book));

  actionCell.appendChild(stock);
  actionCell.appendChild(document.createElement("br"));
  actionCell.appendChild(button);

  row.append(coverCell, titleCell, authorCell, categoryCell, priceCell, actionCell);
  return row;
}

/**
 * Render a list of books into the catalogue table.
 * Clears the old rows, then loops over the list and injects a row per book.
 * Also shows or hides the empty-state message and the result count.
 *
 * @param {Array<Object>} books - books to display
 */
function renderCatalogue(books) {
  const tbody = document.getElementById("catalogue-body");
  const emptyState = document.getElementById("empty-state");
  const count = document.getElementById("results-count");

  tbody.innerHTML = "";               // remove previous rows

  // Loop over the books and append a row for each one.
  // Loop by index so each card knows its position (used for the stagger delay).
  for (let i = 0; i < books.length; i++) {
    tbody.appendChild(createBookRow(books[i], i));
  }

  const hasResults = books.length > 0;
  emptyState.classList.toggle("hidden", hasResults);
  count.textContent = hasResults
    ? `Showing ${books.length} of ${BOOKS.length} books`
    : "";
}

/* ===============================================================
   5. Add to order and notification
   =============================================================== */

/**
 * Add a book to the order. If it is already there, increase its
 * quantity; otherwise create a new CartItem for it.
 *
 * @param {Object} book - the book the visitor chose
 */
function addToOrder(book) {
  const order = loadOrder();
  const existing = order.find((item) => item.title === book.title);

  if (existing) {
    existing.addOne();
  } else {
    // Instantiate a new CartItem from the class for this book.
    order.push(new CartItem(book.title, 1, book.price_egp));
  }

  saveOrder(order);
  showToast(`"${book.title}" added to your order.`);
}

/**
 * Show a short confirmation message that fades out after a few seconds.
 * @param {string} message
 */
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2500);
}

/* ===============================================================
   6. Order page: summary
   =============================================================== */

/** Draw the list of books and the total on the order page. */
function renderOrderSummary() {
  const list = document.getElementById("order-items");
  const emptyNote = document.getElementById("order-empty");
  const totalRow = document.getElementById("order-total-row");
  const totalCell = document.getElementById("order-total");
  const order = loadOrder();

  list.innerHTML = "";

  let grandTotal = 0;
  for (const item of order) {
    const li = document.createElement("li");
    const label = document.createElement("span");
    label.textContent = `${item.title} × ${item.quantity}`;
    const amount = document.createElement("span");
    amount.textContent = `${item.lineTotal} EGP`;
    li.append(label, amount);
    list.appendChild(li);
    grandTotal += item.lineTotal;
  }

  const hasItems = order.length > 0;
  emptyNote.classList.toggle("hidden", hasItems);
  totalRow.classList.toggle("hidden", !hasItems);
  totalCell.textContent = `${grandTotal} EGP`;
}

/* ===============================================================
   7. Order page: form validation (live and on submit)
   Each field has its own rules. Errors appear when the visitor leaves
   a field, clear as soon as the value is fixed, and are checked again
   on submit.
   =============================================================== */

const VALIDATION_MESSAGE =
  "Please ensure both your Full Name and Delivery Address are provided before submitting your order.";

// Egyptian mobile numbers: 010, 011, 012 or 015 followed by 8 digits (11 digits total).
const EGYPT_MOBILE_RE = /^01[0125][0-9]{8}$/;
// Simple email shape check: something@something.tld
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Maps each validated field name to the id prefix used for its error message.
const FIELD_IDS = {
  fullName: "full-name",
  email: "email",
  phone: "phone",
  address: "address",
};

/**
 * Return the error message for one field, or "" if the value is valid.
 * All four fields are required; email and phone also need a valid format.
 *
 * @param {string} name       - field name (fullName, email, phone, address)
 * @param {string} rawValue   - the value as typed
 * @returns {string}          - error message, or "" when valid
 */
function getFieldError(name, rawValue) {
  const value = rawValue.trim();

  switch (name) {
    case "fullName":
      if (value === "") return "Full name is required.";
      if (value.length < 5) return "Please enter at least 5 characters.";
      return "";

    case "address":
      if (value === "") return "Delivery address is required.";
      if (value.length < 5) return "Please include your street, neighbourhood and city.";
      return "";

    case "email":
      if (value === "") return "Email address is required.";
      return EMAIL_RE.test(value) ? "" : "Enter a valid email, e.g. name@example.com.";

    case "phone": {
      const digits = value.replace(/[\s-]/g, "");        // allow spaces and dashes
      if (digits === "") return "Phone number is required.";
      return EGYPT_MOBILE_RE.test(digits)
        ? ""
        : "Enter an Egyptian mobile number: 010, 011, 012 or 015 followed by 8 digits.";
    }

    default:
      return "";
  }
}

/**
 * Write (or clear) the error message for one field and set aria-invalid.
 * @param {HTMLFormElement} form
 * @param {string} name
 * @param {string} message - "" clears the error
 */
function showFieldError(form, name, message) {
  const input = form.elements[name];
  const errorEl = document.getElementById(FIELD_IDS[name] + "-error");
  errorEl.textContent = message;

  if (message) {
    input.setAttribute("aria-invalid", "true");
  } else {
    input.removeAttribute("aria-invalid");
  }
}

/**
 * Validate one field and show or clear its message.
 * @returns {boolean} true if the field is valid
 */
function validateField(form, name) {
  const message = getFieldError(name, form.elements[name].value);
  showFieldError(form, name, message);
  return message === "";
}

/**
 * Attach live validation: check a field when the visitor leaves it (blur),
 * and while typing only if that field already shows an error, so the
 * message clears as soon as the value is fixed.
 * @param {HTMLFormElement} form
 */
function attachLiveValidation(form) {
  for (const name of Object.keys(FIELD_IDS)) {
    const input = form.elements[name];

    input.addEventListener("blur", () => validateField(form, name));

    input.addEventListener("input", () => {
      if (input.getAttribute("aria-invalid") === "true") {
        validateField(form, name);
      }
    });
  }
}

/**
 * Validate the whole form on submit. Shows inline messages for every
 * invalid field, plus an alert. Focuses the first invalid field.
 *
 * @param {HTMLFormElement} form
 * @returns {boolean} true if the form may be submitted
 */
function validateOrderForm(form) {
  const names = Object.keys(FIELD_IDS);
  const failed = names.filter((name) => !validateField(form, name));

  if (failed.length === 0) {
    return true;
  }

  // Name or address blank: use the client's exact alert wording.
  const requiredBlank = ["fullName", "address"].some(
    (name) => failed.includes(name) && form.elements[name].value.trim() === ""
  );

  if (requiredBlank) {
    alert(VALIDATION_MESSAGE);
  } else {
    const details = failed.map((name) => getFieldError(name, form.elements[name].value));
    alert("Please correct the highlighted fields:\n- " + details.join("\n- "));
  }

  form.elements[failed[0]].focus();
  return false;
}

/** Hide the form, show the thank-you panel and clear the saved order. */
function showThankYou() {
  document.getElementById("order-form").classList.add("hidden");
  document.querySelector(".order-summary").classList.add("hidden");
  document.getElementById("thank-you").classList.remove("hidden");
  saveOrder([]);
  document.getElementById("thank-you").scrollIntoView({ behavior: "smooth", block: "center" });
}


/* ===============================================================
   8. Page setup
   Each page runs only the code it needs, based on which elements exist.
   =============================================================== */

document.addEventListener("DOMContentLoaded", () => {

  // ---- Catalogue page ----
  const catalogueBody = document.getElementById("catalogue-body");
  if (catalogueBody) {
    renderCatalogue(BOOKS);

    const searchForm = document.getElementById("search-form");
    const searchInput = document.getElementById("search-input");

    // Filter when the form is submitted (Search button or Enter key).
    searchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      renderCatalogue(filterBooks(BOOKS, searchInput.value));
    });

    // Filter live as the visitor types.
    searchInput.addEventListener("input", () => {
      renderCatalogue(filterBooks(BOOKS, searchInput.value));
    });
  }

  // ---- Order page ----
  const orderForm = document.getElementById("order-form");
  if (orderForm) {
    renderOrderSummary();
    attachLiveValidation(orderForm);

    orderForm.addEventListener("submit", (event) => {
      event.preventDefault();

      // Stop submission if validation fails.
      if (!validateOrderForm(orderForm)) {
        return;
      }

      showThankYou();
    });
  }
});

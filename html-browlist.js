/**
 * html-browlist
 * Editable table generator (vanilla JS)
 */

(function (global) {
  function htmlBrowlist(data, container, options = {}) {
    if (!Array.isArray(data)) {
      throw new Error("First argument must be an array of objects");
    }
    if (!(container instanceof HTMLElement)) {
      throw new Error("Second argument must be a DOM element");
    }

    const {
      tableClass = "",
      footerRowHeight = "48px",
      onChange = () => {},
      onInsert = () => {},
      onDelete = () => {}
    } = options;

    const table = document.createElement("table");
    table.className = tableClass;

    const keys = data.length ? Object.keys(data[0]) : [];

    const thead = document.createElement("thead");
    const tbody = document.createElement("tbody");
    const tfoot = document.createElement("tfoot");

    /* ---------- HEADER ---------- */
    const headerRow = document.createElement("tr");
    keys.forEach(key => {
      const th = document.createElement("th");
      th.textContent = key;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    /* ---------- BODY ---------- */
    function renderBody() {
      tbody.innerHTML = "";

      data.forEach((row, rowIndex) => {
        const tr = document.createElement("tr");

        keys.forEach(key => {
          const td = document.createElement("td");
          td.textContent = row[key] ?? "";

          td.addEventListener("click", () =>
            makeEditable(td, row, key, rowIndex)
          );

          tr.appendChild(td);
        });

        tbody.appendChild(tr);
      });
    }

    /* ---------- FOOTER (NEW ROW) ---------- */
    function renderFooter() {
      tfoot.innerHTML = "";

      const tr = document.createElement("tr");
      tr.style.height = footerRowHeight;

      const newRow = {};
      keys.forEach(k => (newRow[k] = ""));

      keys.forEach(key => {
        const td = document.createElement("td");
        td.style.minHeight = footerRowHeight;
        td.style.cursor = "text";
        td.innerHTML = "&nbsp;"; // ensures visible height

        td.addEventListener("click", () =>
          makeEditable(td, newRow, key, null, true)
        );

        tr.appendChild(td);
      });

      tfoot.appendChild(tr);
    }

    /* ---------- CELL EDIT ---------- */
    function makeEditable(td, rowObj, key, rowIndex, isNewRow = false) {
      if (td.querySelector("input")) return;

      const oldValue = rowObj[key] ?? "";

      const input = document.createElement("input");
      input.type = "text";
      input.value = oldValue;
      input.style.width = "100%";
      input.style.boxSizing = "border-box";

      td.textContent = "";
      td.appendChild(input);
      input.focus();

      function commit() {
        const newValue = input.value.trim();
        rowObj[key] = newValue;
        td.textContent = newValue || "";

        /* ---------- EXISTING ROW ---------- */
        if (!isNewRow) {
          const isRowEmpty = keys.every(k => !rowObj[k]);

          if (isRowEmpty) {
            const removed = data.splice(rowIndex, 1)[0];
            onDelete(removed);
            renderBody();
            return;
          }

          if (oldValue !== newValue) {
            onChange(rowIndex, key, oldValue, newValue, rowObj);
          }
          return;
        }

        /* ---------- NEW ROW ---------- */
        const allEmpty = keys.every(k => !rowObj[k]);
        if (allEmpty) return;

        const insertedRow = { ...rowObj };
        data.push(insertedRow);
        onInsert(insertedRow);

        renderBody();
        renderFooter();
      }



      input.addEventListener("keydown", e => {
        if (e.key === "Enter") input.blur();
      });

      input.addEventListener("blur", commit);
    }

    /* ---------- DELETE EMPTY ROWS ---------- */
    function cleanupEmptyRows() {
      for (let i = data.length - 1; i >= 0; i--) {
        const row = data[i];
        const empty = keys.every(k => !row[k]);
        if (empty) {
          const removed = data.splice(i, 1)[0];
          onDelete(removed);
        }
      }
    }

    /* ---------- INIT ---------- */
    renderBody();
    renderFooter();

    table.appendChild(thead);
    table.appendChild(tbody);
    table.appendChild(tfoot);

    container.innerHTML = "";
    container.appendChild(table);

    // public API
    return {
      table,
      refresh: () => {
        cleanupEmptyRows();
        renderBody();
        renderFooter();
      },
      data
    };
  }

  global.htmlBrowlist = htmlBrowlist;
})(window);

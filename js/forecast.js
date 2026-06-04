function parseSeries(raw) {
  let text = String(raw || "").trim();

  if (!text) {
    return [];
  }

  let parts;

  if (/[;\n\t]/.test(text)) {
    parts = text.split(/[;\n\t]+/);
  } else {

    parts = text.split(",");
  }

  return parts
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => Number(s.replace(",", ".")));
}


async function runForecast() {
  const method = document.getElementById("method").value;
  const raw = document.getElementById("fvalues").value.trim();
  const horizon = Number(document.getElementById("horizon").value);

  let values;

  if (method === "regression") {
    // Парсим JSON массив объектов для regression
    try {
      values = JSON.parse(raw);
      if (!Array.isArray(values)) throw new Error();
    } catch {
      showOut("fresult", "err", "Для regression введите массив объектов JSON с ключами K_trud, L, delta_K_trud, delta_L, epsilon");
      return;
    }
  } else {
    values = parseSeries(raw);
    if (values.length === 0) {
      showOut("fresult", "err", "Не удалось прочитать временной ряд");
      return;
    }
    if (values.some(v => Number.isNaN(v))) {
      showOut("fresult", "err", "Есть нечисловые значения. Проверь формат ввода.");
      return;
    }
    if (method === "neural" && values.length < 6) {
      showOut("fresult", "err", "Для нейросетевого прогноза желательно минимум 6 значений. Добавь больше данных.");
      return;
    }
  }

  try {
    const result = await apiPost("/forecast", { method, values, horizon });

    if (!result || !result.forecast || result.forecast.length === 0) {
      showOut("fresult", "err", "Не удалось получить прогноз. Проверь backend.");
      return;
    }

    const lines = result.forecast.map((v, i) => `${i + 1}: ${v}`).join("\n");
    let note = "";
    if (method === "average") note = "\n\nПримечание: метод среднего уровня всегда даёт постоянный прогноз.";
    if (method === "moving") note = "\n\nПримечание: скользящее среднее даёт прогноз по последнему окну.";
    if (method === "holt") note = "\n\nПримечание: Holt учитывает тренд ряда.";
    if (method === "neural") note = "\n\nПримечание: нейросеть обучается на введённом ряду.";
    if (method === "regression") note = "\n\nПримечание: regression использует формулу BPP = K*L + ΔK*ΔL + ε.";

    showOut("fresult", "ok", `Прогноз на ${horizon} период(ов):\n${lines}${note}`);
  } catch (e) {
    showOut("fresult", "err", e.message || "Ошибка прогноза");
  }
}


function showOut(id, type, text) {
  const el = document.getElementById(id);
  el.className = "out " + (type || "");
  el.textContent = text;
}


document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("forecastFile");
  const textarea = document.getElementById("fvalues");

  if (!fileInput || !textarea) return;

  fileInput.addEventListener("change", (event) => {
    const file = event.target.files && event.target.files[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      let text = String(e.target.result || "");

      text = text.replace(/\r\n/g, "\n");

      textarea.value = text;

      showOut(
        "fresult",
        "",
        `Файл загружен: ${file.name}. Нажми "Построить прогноз".`
      );
    };

    reader.onerror = () => {
      showOut("fresult", "err", "Ошибка чтения файла.");
    };

    reader.readAsText(file);
  });
});


window.runForecast = runForecast;
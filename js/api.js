const API_URL = "https://siteprognoz-1.onrender.com";
const TOKEN_KEY = "access_token";

function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function saveAccessToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

function clearAccessToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function parseError(data) {
  if (!data) {
    return "Неизвестная ошибка";
  }

  if (typeof data.detail === "string") {
    return translateError(data.detail);
  }

  if (Array.isArray(data.detail)) {
    return data.detail
      .map(err => {
        let field = "";

        if (Array.isArray(err.loc) && err.loc.length > 1) {
          field = err.loc[1];
        }

        return formatValidationError(field, err.msg);
      })
      .join("\n");
  }

  return "Ошибка запроса";
}

function formatValidationError(field, msg) {
  field = translateField(field);
  msg = translateError(msg);

  if (field) {
    return `${field}: ${msg}`;
  }

  return msg;
}

function translateField(field) {
  const fields = {
    username: "Логин",
    email: "Email",
    password: "Пароль",
    login: "Логин"
  };

  return fields[field] || field;
}

function translateError(msg) {
  const translations = {
    "String should have at least 8 characters":
      "Минимум 8 символов",

    "value is not a valid email address":
      "Некорректный email",

    "Field required":
      "Поле обязательно",

    "Неверный логин или пароль":
      "Неверный логин или пароль",

    "Пользователь уже существует":
      "Пользователь уже существует",

    "Username already exists":
      "Логин уже занят",

    "Email already exists":
      "Email уже используется",
  };

  return translations[msg] || msg;
}

async function apiRequest(endpoint, options = {}) {
  const token = getAccessToken();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  // Главное изменение:
  // если пользователь вошёл, отправляем JWT в Authorization header.
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(API_URL + endpoint, {
    ...options,
    credentials: "include",
    headers
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401) {
      clearAccessToken();
    }

    throw new Error(parseError(data));
  }

  return data;
}

async function apiGet(endpoint) {
  return apiRequest(endpoint);
}

async function apiPost(endpoint, data) {
  return apiRequest(endpoint, {
    method: "POST",
    body: JSON.stringify(data)
  });
}

async function apiPostAuth(endpoint, data) {
  return apiPost(endpoint, data);
}
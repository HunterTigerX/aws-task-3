"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.proxyRequest = void 0;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
const json_2_csv_1 = require("json-2-csv");
const cache_1 = require("./cache");
dotenv_1.default.config();
const serviceMap = {
    cart: process.env.CART_SERVICE_URL,
    product: process.env.PRODUCT_SERVICE_URL,
    import: process.env.IMPORT_SERVICE_URL,
    authorization: process.env.AUTHORIZATION_SERVICE_URL,
    profile: process.env.PROFILE_SERVICE_URL,
};
async function axiosRequests(method, url, headers, data) {
    // console.log("method", method);
    // console.log("url", url);
    // console.log("data", data);
    let response;
    try {
        if (data && method !== "GET") {
            response = await (0, axios_1.default)({
                method,
                url,
                headers,
                data,
            });
        }
        else {
            response = await (0, axios_1.default)({
                method,
                url,
                headers,
            });
        }
        return response;
    }
    catch (error) {
        if (axios_1.default.isAxiosError(error)) {
            console.error("Axios error:", error.response?.statusText);
            return {
                status: error.response?.status || 500,
                data: {
                    message: error.response?.data,
                    status: error.response?.status || 500,
                },
            };
        }
        else {
            console.error("Error:", error);
        }
    }
}
function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}
function ifTheRightFormat(name) {
    try {
        if (!name.toLowerCase().endsWith(".csv")) {
            return { isValid: false, error: "Файл должен иметь расширение .csv" };
        }
        // Список запрещённых символов в именах файлов (можно дополнить)
        const forbiddenChars = /[<>:"/\\|?*\x00-\x1F]/;
        const fileNameWithoutExt = name.slice(0, -4);
        // Проверка на наличие запрещённых символов
        if (forbiddenChars.test(fileNameWithoutExt)) {
            return {
                isValid: false,
                error: 'Имя файла содержит недопустимые символы: <>:"/\\|?* и управляющие символы ASCII',
            };
        }
        // Проверка на зарезервированные имена в Windows
        const reservedNames = [
            "CON",
            "PRN",
            "AUX",
            "NUL",
            "COM1",
            "COM2",
            "COM3",
            "COM4",
            "COM5",
            "COM6",
            "COM7",
            "COM8",
            "COM9",
            "LPT1",
            "LPT2",
            "LPT3",
            "LPT4",
            "LPT5",
            "LPT6",
            "LPT7",
            "LPT8",
            "LPT9",
        ];
        if (reservedNames.includes(fileNameWithoutExt.toUpperCase())) {
            return { isValid: false, error: "Имя файла зарезервировано системой" };
        }
        // Проверка длины имени (например, не более 255 символов)
        if (name.length > 255) {
            return { isValid: false, error: "Имя файла слишком длинное" };
        }
        return true;
    }
    catch (e) {
        // Обработка случая, когда переданная строка не является валидным URL
        return false;
    }
}
function notFound(serviceName) {
    return {
        status: 502,
        data: { message: `Service URL not configured for ${serviceName}` },
    };
}
const proxyRequest = async (serviceName, method, path, query, headers, body) => {
    // console.log("serviceName", serviceName);
    // console.log("method", method);
    // console.log("path", path);
    // console.log("query", query);
    // console.log("headers", headers);
    // console.log("body", body);
    let requestUrl = "";
    let productId = "";
    let queryElement = "";
    const cleanHeaders = {
        "Content-Type": "application/json",
        ...(headers.authorization && {
            Authorization: headers.authorization,
        }),
        ...(headers["x-api-key"] && { "x-api-key": headers["x-api-key"] }),
    };
    try {
        if (!serviceMap.product) {
            return {
                status: 500,
                data: {
                    message: "Env URL's are missing",
                },
            };
        }
        else if (serviceName === "product" || serviceName === "products") {
            if (method === "GET") {
                const cacheKey = `products_${isEmpty(query) ? "all" : Object.keys(query)[0]}`;
                // Check cache first
                const cachedData = (0, cache_1.getFromCache)(cacheKey);
                if (cachedData) {
                    return {
                        status: 200,
                        data: cachedData,
                        headers: {
                            "X-Cache": "HIT",
                        },
                    };
                }
                if (isEmpty(query)) {
                    // Значит это пути http://localhost:3000/products или http://localhost:3000/product
                    requestUrl = `${serviceMap.product}/products`;
                }
                else {
                    // Значит это пути http://localhost:3000/product?available или http://localhost:3000/products?4a655224-177c-462b-964e-1452e295fe4d или http://localhost:3000/product?4a655224-177c-462b-964e-1452e295fe4d
                    productId = Object.keys(query)[0];
                    if (productId !== "available") {
                        requestUrl = `${serviceMap.product}/products/${productId}`;
                    }
                    else {
                        requestUrl = `${serviceMap.product}/products`;
                    }
                }
                const result = await axiosRequests(method, requestUrl, cleanHeaders);
                // console.log("result 1", result);
                // Cache the response if successful
                if (result && result.status === 200) {
                    (0, cache_1.setToCache)(cacheKey, result.data);
                    return {
                        ...result,
                        headers: {
                            ...cleanHeaders,
                            "X-Cache": "MISS",
                        },
                    };
                }
                return result;
            }
            else if (method === "PUT") {
                requestUrl = `${serviceMap.product}/product`;
                const result = await axiosRequests(method, requestUrl, cleanHeaders, body);
                // console.log("result 2", result);
                return result;
            }
            else if (method === "DELETE") {
                // console.log("Trying to delete");
                if (!isEmpty(query)) {
                    productId = Object.keys(query)[0];
                    const newBody = {
                        productId,
                    };
                    const result = await axiosRequests(method, `${serviceMap.product}/product`, cleanHeaders, newBody);
                    // console.log("result 3", result);
                    return result;
                }
                else {
                    return {
                        status: 500,
                        data: {
                            message: "No id in URL query",
                        },
                    };
                }
            }
            else {
                return notFound(serviceName);
            }
        }
        else if (serviceName === "cart") {
            if (method === "GET") {
                if (!isEmpty(query)) {
                    // Значит запрос на http://localhost:3000/cart?order
                    queryElement = Object.keys(query)[0];
                    if (queryElement === "order") {
                        requestUrl = `${serviceMap.cart}/order`;
                        const result = await axiosRequests(method, requestUrl, cleanHeaders);
                        // console.log("result 4", result);
                        return result;
                    }
                }
                else {
                    // Значит запрос на http://localhost:3000/cart
                    const result = await axiosRequests(method, serviceMap.cart, cleanHeaders);
                    // console.log("result 5", result);
                    return result;
                }
            }
            else if (method === "PUT") {
                if (!isEmpty(query)) {
                    // Значит запрос на http://localhost:3000/cart?order
                    queryElement = Object.keys(query)[0];
                    if (queryElement === "order") {
                        requestUrl = `${serviceMap.cart}/order`;
                        const result = await axiosRequests(method, requestUrl, cleanHeaders, body);
                        // console.log("result 6.1", result);
                        return result;
                    }
                }
                else {
                    // Значит запрос на http://localhost:3000/cart
                    const result = await axiosRequests(method, serviceMap.cart, cleanHeaders, body);
                    // console.log("result 6.2", result);
                    return result;
                }
            }
            else {
                return notFound(serviceName);
            }
        }
        else if (serviceName === "profile") {
            if (method === "GET") {
                const result = await axiosRequests(method, serviceMap.profile, cleanHeaders);
                // console.log("result 7", result);
                return result;
            }
            else {
                return notFound(serviceName);
            }
        }
        else if (serviceName === "import") {
            if (method === "POST") {
                if (!isEmpty(query)) {
                    const csvKey = Object.keys(query)[0];
                    const csvFileName = Object.values(query)[0];
                    const checkCsv = ifTheRightFormat(csvFileName);
                    if (csvKey === "name" && checkCsv) {
                        const csv = await (0, json_2_csv_1.json2csv)(body);
                        // First, get the signed URL
                        const newData = {
                            csv,
                            csvFileName,
                            csvKey,
                            cleanHeaders,
                        };
                        const result = await axiosRequests(method, serviceMap.import, cleanHeaders, newData);
                        // console.log("result", result);
                        return result;
                    }
                    else {
                        return {
                            status: 500,
                            data: {
                                message: "invalid format of the file or invalid name or invalid key in query",
                            },
                        };
                    }
                }
                else {
                    return { status: 400, data: { message: "No body in the request" } };
                }
            }
            else {
                return notFound(serviceName);
            }
        }
        else if (serviceName === "authorization") {
            if (method === "POST") {
                if (!isEmpty(query)) {
                    // Значит запрос на http://localhost:3000/cart?order
                    queryElement = Object.keys(query)[0];
                    if (queryElement === "register") {
                        const result = await axiosRequests(method, `${serviceMap.authorization}/register`, cleanHeaders, body);
                        // console.log("result 8", result);
                        return result;
                    }
                    else if (queryElement === "login") {
                        const result = await axiosRequests(method, `${serviceMap.authorization}/login`, cleanHeaders, body);
                        // console.log("result 9", result);
                        return result;
                    }
                    else {
                        return {
                            status: 500,
                            data: {
                                message: "Invalid query",
                            },
                        };
                    }
                }
            }
            else {
                return notFound(serviceName);
            }
        }
        else {
            return notFound(serviceName);
        }
    }
    catch (error) {
        return {
            status: 500,
            data: { message: "Internal server error at proxy.ts" },
        };
    }
};
exports.proxyRequest = proxyRequest;

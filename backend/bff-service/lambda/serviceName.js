function isServiceName(value) {
  if (
    value === "product" ||
    value === "products" ||
    value === "cart" ||
    value === "authorization" ||
    value === "import" ||
    value === "profile"
  ) {
    return true;
  } else {
    return false;
  }
}
module.exports = { isServiceName };
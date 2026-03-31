// Generates a unique order reference like LB-82941
function generateOrderRef() {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `LB-${num}`;
}

module.exports = { generateOrderRef };

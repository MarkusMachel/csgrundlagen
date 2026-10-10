const a = { n: 1, inner: { n: 1 } };
const b = { ...a };
b.n = 2;
b.inner.n = 2;
console.log(a.n, a.inner.n);
